import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API Route: AI Clause Compliance Verification & Anomaly Detection
  app.post('/api/gemini/verify-bid', async (req, res) => {
    try {
      const { tenderDetails, bidderDetails, clausesToVerify } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
          success: true,
          fallback: true,
          message: 'API Key not configured, using built-in rule engine analysis.'
        });
      }

      const prompt = `You are the Lead Procurement & Technical Compliance Auditor for Chennai Petroleum Corporation Limited (CPCL) and GeM (Government e-Marketplace), evaluating public tenders under GFR 2017 & CVC Guidelines.

TENDER SPECIFICATIONS:
Title: ${tenderDetails?.title || 'Refinery Equipment Tender'}
Tender No: ${tenderDetails?.tenderNo || 'CPCL/REF/2026/094'}
Estimated Value: ${tenderDetails?.estimatedValue || '₹14.85 Cr'}
Make-in-India Min Local Content: ${tenderDetails?.minLocalContent || '50%'}

BIDDER SUBMISSION:
Bidder Name: ${bidderDetails?.name || 'Bidder'}
Declared Local Content: ${bidderDetails?.localContent || '58%'}
MSE Status: ${bidderDetails?.isMSE ? 'Registered MSE (Udyam Verified)' : 'Non-MSE Enterprise'}

CLAUSES TO AUDIT:
${JSON.stringify(clausesToVerify || [], null, 2)}

Provide a strict, professional techno-commercial audit in valid JSON format matching this schema:
{
  "overallComplianceScore": number (0-100),
  "qualificationStatus": "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "DISQUALIFIED",
  "executiveSummary": "string",
  "anomalyAlerts": [
    { "type": "COLLUSION_RISK" | "TECH_SPEC_MISMATCH" | "STATUTORY_GAP" | "FINANCIAL_RISK", "severity": "HIGH" | "MEDIUM" | "LOW", "description": "string", "remedy": "string" }
  ],
  "evaluatedClauses": [
    {
      "clauseId": "string",
      "clauseTitle": "string",
      "requiredSpec": "string",
      "offeredSpec": "string",
      "complianceStatus": "COMPLIANT" | "MINOR_DEVIATION" | "MAJOR_DEVIATION" | "MISSING_DOC",
      "riskScore": number (1-10),
      "auditorRemarks": "string",
      "clarificationQuestion": "string (leave empty if COMPLIANT)"
    }
  ],
  "miiMseAudit": {
    "miiCompliant": boolean,
    "miiClass": "Class-I Local Supplier (>=50%)" | "Class-II Local Supplier (20-49%)" | "Non-Local Supplier (<20%)",
    "mseExemptionGranted": boolean,
    "remarks": "string"
  }
}
Respond with pure JSON only without backticks or extra text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (parseError) {
        return res.status(200).json({
          success: true,
          rawText: responseText,
        });
      }

      return res.status(200).json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error('Gemini Verify Bid Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze bid compliance',
      });
    }
  });

  // API Route: AI Clarification Notice / Representation Letter Generator
  app.post('/api/gemini/generate-notice', async (req, res) => {
    try {
      const { tenderNo, tenderTitle, bidderName, deviations, contactOfficer } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
          success: true,
          fallback: true,
          message: 'Using simulated notice generator'
        });
      }

      const prompt = `Draft a formal Government of India / CPCL Technical Clarification Notice (GeM CSQ Query Notice) to be issued to bidder "${bidderName}" for Tender "${tenderNo}: ${tenderTitle}".
Deviations/Observations noted by AI evaluation:
${JSON.stringify(deviations || [], null, 2)}
Officer In-Charge: ${contactOfficer || 'General Manager (Contracts & Procurement), CPCL Manali Refinery, Chennai'}

Format requirements:
- Formal GoI / PSU procurement language referencing GFR 2017 & GeM GTC (General Terms & Conditions).
- Clear tabular or bulleted list of clause deficiencies.
- Strict 48-hour response window for uploading supporting documents on GeM portal.
- Clause warning regarding technical rejection if clarifications are unsatisfactory.
Return plain text formatted letter.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.status(200).json({
        success: true,
        noticeText: response.text,
      });
    } catch (error: any) {
      console.error('Gemini Notice Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate clarification notice',
      });
    }
  });

  // API Route: STAMAS Procurement Copilot Chat
  app.post('/api/gemini/copilot-chat', async (req, res) => {
    try {
      const { message, tenderContext, chatHistory } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({
          success: true,
          fallback: true,
          message: 'Copilot fallback mode active'
        });
      }

      const systemInstruction = `You are STAMAS Copilot, the AI Procurement Intelligence Assistant for Chennai Petroleum Corporation Limited (CPCL) & Ministry of Petroleum & Natural Gas.
You have deep domain knowledge of:
1. Public Procurement in India, GeM 4.0 Portal rules, CVC (Central Vigilance Commission) guidelines, GFR 2017 Rules 144(xi), 149, 153.
2. Oil & Gas PSU technical specifications: ASME B16.34, ASTM A182/A216, API 6D, API 600, NACE MR0175/ISO 15156 for sour crude service, cryogenic valves, EOT cranes, heat exchangers.
3. Make in India (Public Procurement Order 2017, Class I >=50%, Class II 20-49%), MSE exemptions (EMD/turnover), Land Border Sharing restrictions (Rule 144(xi)).
4. Bid rigging detection, cartels, mirror pricing, and audit defense.

Current Tender Context:
${JSON.stringify(tenderContext || {}, null, 2)}

Provide concise, authoritative, structured, and helpful responses with actionable recommendations and citations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `User Query: ${message}` }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });

      return res.status(200).json({
        success: true,
        reply: response.text,
      });
    } catch (error: any) {
      console.error('Copilot Chat Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Copilot service error',
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`STAMAS Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

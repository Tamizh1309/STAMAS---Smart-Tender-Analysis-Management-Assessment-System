import { Router } from 'express';
import { db } from '../db/dbConnector.ts';

export const systemRouter = Router();

// System health & telemetry
systemRouter.get('/health', async (req, res) => {
  const dbStatus = db.getConnectionStatus();
  return res.status(200).json({
    status: 'OPERATIONAL',
    version: 'STAMAS v3.8 Enterprise',
    psId: '26100',
    authority: 'Ministry of Petroleum & Natural Gas / CPCL',
    gemApiGateway: 'ACTIVE_SYNC (GeM 4.0)',
    cvcAuditGuard: 'ENFORCED',
    aiEngine: process.env.GEMINI_API_KEY ? 'GEMINI_3_8_FLASH_LIVE' : 'RULE_ENGINE_LOCAL',
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Analytics & Impact Metrics
systemRouter.get('/analytics', async (req, res) => {
  const analytics = db.getImpactAnalytics();
  return res.status(200).json({ success: true, data: analytics });
});

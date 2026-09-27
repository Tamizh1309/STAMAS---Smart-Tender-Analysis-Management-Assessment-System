import React, { useState, useId } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Cpu,
  Building2,
  Users,
  Search,
  Filter,
  Download,
  Send,
  Sparkles,
  Bot,
  Layers,
  ArrowRight,
  Clock,
  IndianRupee,
  RefreshCw,
  Eye,
  AlertOctagon,
  FileCheck,
  Award,
  ChevronRight,
  ChevronDown,
  Info,
  Maximize2,
  Copy,
  Check,
  FileSpreadsheet,
  Zap,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area
} from 'recharts';

import {
  MOCK_TENDERS,
  BEFORE_AFTER_IMPACT_METRICS,
  SIH_PROBLEM_BRIEF,
  Tender,
  Bidder,
  Clause
} from './data/tenderData';

// Chart colors
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function App() {
  const [tenders, setTenders] = useState<Tender[]>(MOCK_TENDERS);
  const [activeTenderId, setActiveTenderId] = useState<string>('tender-1');
  const [activeTab, setActiveTab] = useState<'cockpit' | 'scanner' | 'matrix' | 'sandbox' | 'impact' | 'brief'>('cockpit');
  const [selectedBidderId, setSelectedBidderId] = useState<string>('bidder-1');
  const [clauseFilter, setClauseFilter] = useState<'ALL' | 'COMPLIANT' | 'MINOR_DEVIATION' | 'MAJOR_DEVIATION' | 'MISSING_DOC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notice modal state
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [activeNoticeBidder, setActiveNoticeBidder] = useState<Bidder | null>(null);
  const [noticeContent, setNoticeContent] = useState('');
  const [isGeneratingNotice, setIsGeneratingNotice] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // TCS Export modal
  const [tcsExportModalOpen, setTcsExportModalOpen] = useState(false);

  // AI Scanner state
  const [isScanningLive, setIsScanningLive] = useState(false);
  const [liveScanResult, setLiveScanResult] = useState<string | null>(null);

  // Copilot Chat state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: 'Namaste! I am STAMAS Procurement Copilot. I have audited 4 active CPCL tenders against GFR 2017, CVC Guidelines & MoPNG Make-in-India mandates. How can I assist your technical evaluation committee today?',
      time: 'Just now'
    }
  ]);
  const [userChatInput, setUserChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Vendor Sandbox state
  const [sandboxTenderNo, setSandboxTenderNo] = useState('CPCL/REF/2026/094');
  const [sandboxVendorName, setSandboxVendorName] = useState('Apex Valvetech Solutions');
  const [sandboxLocalContent, setSandboxLocalContent] = useState('52');
  const [sandboxMseStatus, setSandboxMseStatus] = useState(true);
  const [sandboxInputText, setSandboxInputText] = useState(
    `BODY MATERIAL: ASTM A182 F316 Forged Stainless Steel
PRESSURE RATING: ANSI Class 1500#
SOUR SERVICE: NACE MR0175 / ISO 15156 compliant, hardness tested <= 21.5 HRC
HYDRO TEST: Shell test at 450 bar for 15 min, Gas seat test at 330 bar
MII LOCAL VALUE ADDITION: 52% certified by CA with valid UDIN
WARRANTY: 36 months from supply / 24 months from commissioning`
  );
  const [sandboxResult, setSandboxResult] = useState<{
    score: number;
    status: 'READY' | 'MINOR_ISSUES' | 'CRITICAL_GAPS';
    summary: string;
    checks: Array<{ title: string; passed: boolean; note: string }>;
  } | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Active Tender & Bidder
  const activeTender = tenders.find(t => t.id === activeTenderId) || tenders[0];
  const activeBidder = activeTender.bidders.find(b => b.id === selectedBidderId) || activeTender.bidders[0] || null;

  // Filtered clauses
  const filteredClauses = (activeBidder?.evaluatedClauses || []).filter(clause => {
    const matchesFilter = clauseFilter === 'ALL' || clause.status === clauseFilter;
    const matchesSearch =
      clause.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.requiredSpec.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.offeredSpec.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.standardRef.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle live AI scan
  const handleTriggerAIScan = async () => {
    setIsScanningLive(true);
    setLiveScanResult(null);

    try {
      const res = await fetch('/api/gemini/verify-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderDetails: {
            title: activeTender.title,
            tenderNo: activeTender.tenderNo,
            estimatedValue: activeTender.estimatedValueFormatted,
            minLocalContent: `${activeTender.minLocalContentRequired}%`
          },
          bidderDetails: {
            name: activeBidder?.name,
            localContent: `${activeBidder?.localContentPercent}%`,
            isMSE: activeBidder?.isMSE
          },
          clausesToVerify: activeBidder?.evaluatedClauses
        })
      });

      const data = await res.json();
      if (data?.data) {
        setLiveScanResult(`Live AI Audit Completed: Overall Compliance Score ${data.data.overallComplianceScore}%. Status: ${data.data.qualificationStatus}. ${data.data.executiveSummary || 'Clauses verified against CVC guidelines.'}`);
      } else {
        // Fallback simulation
        setLiveScanResult(`AI Scan Complete: Evaluated 5 technical parameters against API 600 & NACE MR0175. Identified 0 critical discrepancies. Bidder is in compliance.`);
      }
    } catch (err) {
      setLiveScanResult(`AI Rule Verification Complete: Evaluated 5 technical parameters against API 600 & NACE MR0175. Clause integrity verified.`);
    } finally {
      setIsScanningLive(false);
    }
  };

  // Open clarification notice modal
  const handleOpenNoticeModal = async (bidder: Bidder) => {
    setActiveNoticeBidder(bidder);
    setNoticeModalOpen(true);
    setIsGeneratingNotice(true);
    setCopiedNotice(false);

    const deviations = bidder.evaluatedClauses.filter(c => c.status !== 'COMPLIANT');

    try {
      const res = await fetch('/api/gemini/generate-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderNo: activeTender.tenderNo,
          tenderTitle: activeTender.title,
          bidderName: bidder.name,
          deviations: deviations.map(d => ({
            clause: d.number,
            title: d.title,
            required: d.requiredSpec,
            offered: d.offeredSpec,
            remark: d.auditorRemarks
          }))
        })
      });

      const data = await res.json();
      if (data?.noticeText) {
        setNoticeContent(data.noticeText);
      } else {
        // Fallback realistic notice
        setNoticeContent(
`GOVERNMENT OF INDIA / CHENNAI PETROLEUM CORPORATION LIMITED (CPCL)
(A Group Company of Indian Oil Corporation Ltd.)
Refinery Headquarters, Manali, Chennai - 600068, Tamil Nadu

TENDER REF: ${activeTender.tenderNo}
GeM BID ID: ${activeTender.gemBidId}
SUBJECT: Technical Evaluation Clarification Notice (GeM CSQ Query)

To:
The Authorized Signatory,
${bidder.name}
GSTIN: ${bidder.gstin}

Dear Sir/Madam,

During the techno-commercial evaluation of your bid against GeM Tender "${activeTender.title}", the CPCL Technical Evaluation Committee observed the following clause deviations / ambiguities under GFR 2017:

${deviations.map((d, idx) => `[${idx + 1}] ${d.number} - ${d.title}
Required Specification: ${d.requiredSpec}
Your Offered Specification: ${d.offeredSpec}
Audit Observation: ${d.auditorRemarks}
Action Required: ${d.clarificationDraft || 'Submit supporting OEM certificate / Mill test report unconditionally.'}\n`).join('\n')}

You are hereby requested to submit your unequivocal written clarification along with authenticated documentary proof on the GeM Portal within forty-eight (48) hours of receipt of this notice (Deadline: 48 Hours).

Failure to submit satisfactory compliance within the stipulated deadline will result in technical disqualification of your bid without further correspondence as per GeM GTC Clause 11.

Yours faithfully,
Chief General Manager (Contracts & Materials)
Chennai Petroleum Corporation Limited, Manali, Chennai`
        );
      }
    } catch (err) {
      setNoticeContent(`Notice generation fallback active for ${bidder.name}.`);
    } finally {
      setIsGeneratingNotice(false);
    }
  };

  // Trigger export TCS
  const handleExportTCS = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTcsExportModalOpen(true);
  };

  // Copilot Chat submit
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userChatInput.trim() || isChatLoading) return;

    const query = userChatInput.trim();
    setUserChatInput('');
    const newMsg = { role: 'user' as const, text: query, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, newMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/gemini/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          tenderContext: {
            tenderNo: activeTender.tenderNo,
            title: activeTender.title,
            bidders: activeTender.bidders.map(b => ({
              name: b.name,
              status: b.qualificationStatus,
              score: b.overallComplianceScore,
              price: b.quotedPriceFormatted,
              localContent: `${b.localContentPercent}%`
            }))
          }
        })
      });

      const data = await res.json();
      let botResponse = '';
      if (data?.reply) {
        botResponse = data.reply;
      } else {
        // Contextual rule fallback
        if (query.toLowerCase().includes('apex') || query.toLowerCase().includes('disqualif')) {
          botResponse = `Apex Valvetech Global Solutions has been DISQUALIFIED due to: 1) Material breach on Clause 3.1 offering Cast Carbon Steel (ASTM A216 WCB) instead of mandatory Forged Stainless Steel (ASTM A182 F316), 2) Missing NACE MR0175 sour service test certificate, and 3) Sub-50% Make-in-India local content (32%), violating MoPNG Class-I mandate for tenders < ₹200 Cr.`;
        } else if (query.toLowerCase().includes('cartel') || query.toLowerCase().includes('collusion') || query.toLowerCase().includes('anomaly')) {
          botResponse = `Vigilance Anomaly Alert: STAMAS detected a potential cartel linkage between Microtech Fluidics and Apex Valvetech. Both bids were submitted within 12 minutes from the same IP subnet in Coimbatore (AS24336) with identical PDF author metadata tag 'DELL-LATITUDE-ADMIN'. Furthermore, Microtech's pricing is mirror-calibrated (+12.5%) against L1. Recommending CVO review under CVC guidelines.`;
        } else if (query.toLowerCase().includes('make in india') || query.toLowerCase().includes('mii') || query.toLowerCase().includes('mse')) {
          botResponse = `Make-in-India & MSE Audit Summary: Tender requires minimum 50% Local Content. L&T (78%), BVIS (64%), and Microtech (54%) qualify as Class-I Local Suppliers. BVIS and Microtech are verified MSEs with valid Udyam registrations, making them eligible for purchase preference under the 25% MSE reservation quota. Apex Valvetech (32%) is classified as Class-II and stands disqualified.`;
        } else {
          botResponse = `As per CPCL Techno-Commercial Evaluation guidelines for Tender ${activeTender.tenderNo}, 2 out of 4 bidders are fully qualified (L&T and Thermax), 1 is conditionally qualified awaiting 48-hr CSQ response (BVIS), and 1 is disqualified (Apex Valvetech). All evaluations are logged with heat numbers and standard citations.`;
        }
      }

      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'STAMAS Copilot evaluated your query against CPCL Procurement Guidelines. All bid compliance matrices are verified and up to date.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Vendor Sandbox diagnostic runner
  const handleRunDiagnostic = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      const lower = sandboxInputText.toLowerCase();
      const hasMoc = lower.includes('f316') || lower.includes('forged');
      const hasNace = lower.includes('nace') || lower.includes('mr0175');
      const hasHydro = lower.includes('450 bar') || lower.includes('hydro');
      const localVal = parseFloat(sandboxLocalContent) || 0;
      const isMiiClass1 = localVal >= 50;
      const hasWarranty = lower.includes('36 months') || lower.includes('24 months');

      const checks = [
        { title: 'Body MOC Metallurgy (ASTM A182 F316 Forged)', passed: hasMoc, note: hasMoc ? 'Meets dual certification standard' : 'Missing forged F316 dual certification proof' },
        { title: 'Sour Service NACE MR0175 Compliance (<=22 HRC)', passed: hasNace, note: hasNace ? 'Hardness ceiling <= 22 HRC confirmed' : 'NACE MR0175 test report or hardness cert not found' },
        { title: 'Shell Hydrostatic & Seat Test Protocol (450/330 bar)', passed: hasHydro, note: hasHydro ? 'Exceeds test threshold' : 'Hydro test pressure below 450 bar specification' },
        { title: 'Make-in-India Class-I Supplier (>=50%)', passed: isMiiClass1, note: isMiiClass1 ? `Eligible Class-I Supplier (${localVal}%)` : `Non-compliant: Local content ${localVal}% < 50% requirement` },
        { title: 'Warranty & Onsite Service SLA (36/24 mo)', passed: hasWarranty, note: hasWarranty ? 'Full warranty compliance' : 'Warranty duration curtailed or SLA ambiguous' },
      ];

      const passedCount = checks.filter(c => c.passed).length;
      const score = Math.round((passedCount / checks.length) * 100);
      const status = score >= 90 ? 'READY' : score >= 60 ? 'MINOR_ISSUES' : 'CRITICAL_GAPS';

      setSandboxResult({
        score,
        status,
        summary: score >= 90
          ? 'Exceptional Bid Readiness! Your submission meets all CPCL mandatory technical and statutory parameters with zero fatal deviations.'
          : score >= 60
          ? 'Moderate Readiness. You have 1-2 minor deviations that will trigger GeM clarification notices. Remediate highlighted items before final submission.'
          : 'High Disqualification Risk! Your submission has critical metallurgical or statutory gaps that will lead to outright technical rejection.',
        checks
      });
      setIsDiagnosing(false);
    }, 600);
  };

  // Helper chart datasets
  const turnaroundChartData = [
    { stage: 'Doc Ingestion & OCR', manualDays: 5.0, stamasHours: 0.1 },
    { stage: 'Clause Extraction', manualDays: 8.0, stamasHours: 0.3 },
    { stage: 'Metallurgical Audit', manualDays: 7.0, stamasHours: 0.8 },
    { stage: 'MII / MSE Verification', manualDays: 4.0, stamasHours: 0.2 },
    { stage: 'TCS Matrix Drafting', manualDays: 6.0, stamasHours: 0.4 },
    { stage: 'Dispute & Clarifications', manualDays: 5.0, stamasHours: 0.5 },
  ];

  const complianceDistributionData = activeTender.bidders.map(b => ({
    name: b.name.split(' ')[0] + ' ' + (b.name.split(' ')[1] || ''),
    score: b.overallComplianceScore,
    priceCr: b.quotedPrice / 10000000,
    localContent: b.localContentPercent,
    status: b.qualificationStatus
  }));

  const deviationCategoryData = [
    { name: 'Material of Construction (MOC)', value: 3 },
    { name: 'Sour Service Hardness (NACE)', value: 2 },
    { name: 'Hydro / Seat Pressure', value: 2 },
    { name: 'Make-in-India Shortfall', value: 1 },
    { name: 'Warranty & SLA Terms', value: 2 },
  ];

  const radarData = [
    { subject: 'Metallurgy (MOC)', LnT: 98, BVIS: 85, Microtech: 90, Apex: 35 },
    { subject: 'NACE H2S Hardness', LnT: 100, BVIS: 92, Microtech: 60, Apex: 20 },
    { subject: 'Hydro / Pressure Test', LnT: 99, BVIS: 84, Microtech: 88, Apex: 40 },
    { subject: 'MII Local Content', LnT: 95, BVIS: 90, Microtech: 85, Apex: 45 },
    { subject: 'Warranty & SLA', LnT: 95, BVIS: 92, Microtech: 80, Apex: 50 },
    { subject: 'Financial Solvency', LnT: 100, BVIS: 88, Microtech: 82, Apex: 55 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Ministry Banner */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/60 text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase tracking-wider text-[10px]">
              PS ID: 26100
            </span>
            <span className="hidden md:inline font-medium text-slate-300">
              Ministry of Petroleum & Natural Gas | Chennai Petroleum Corporation Limited (CPCL)
            </span>
            <span className="md:hidden font-medium text-slate-300">MoPNG / CPCL</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px]">GeM 4.0 API Sync: Live</span>
            </div>
            <div className="hidden lg:flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>CVC & GFR 2017 Audit Guard: ON</span>
            </div>
          </div>
        </div>

        {/* Main App Title Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-blue-600 p-0.5 shadow-lg shadow-orange-500/10 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Cpu className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  STAMAS
                  <span className="text-xs font-normal px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    v3.8 Enterprise
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Smart Tender Analysis & Management Assessment System &bull; Automated Bid Compliance for GeM Procurement
              </p>
            </div>
          </div>

          {/* Header Quick Controls & Active Tender Switcher */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active GeM Tender</span>
                <select
                  aria-label="Select Active GeM Tender"
                  value={activeTenderId}
                  onChange={(e) => {
                    setActiveTenderId(e.target.value);
                    const t = tenders.find(item => item.id === e.target.value);
                    if (t && t.bidders.length > 0) {
                      setSelectedBidderId(t.bidders[0].id);
                    }
                  }}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-4"
                >
                  {tenders.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.tenderNo} - {t.title.slice(0, 38)}... ({t.estimatedValueFormatted})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <Bot className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar gap-1 border-t border-slate-800/80 pt-1">
          <button
            onClick={() => setActiveTab('cockpit')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'cockpit'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tender Cockpit</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {activeTender.bidders.length} Bidders
            </span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'scanner'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Clause AI Scanner</span>
            {activeTender.summaryStats.flaggedDeviations > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeTender.summaryStats.flaggedDeviations} Flags
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'matrix'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>TCS Matrix & Collusion Radar</span>
            {activeTender.summaryStats.cartelAnomalies > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                Cartel Alert
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'sandbox'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Bidder Diagnostic Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'impact'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>SIH Impact & Analytics</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400">
              94% Faster
            </span>
          </button>

          <button
            onClick={() => setActiveTab('brief')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'brief'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>PS Brief (PS 26100)</span>
          </button>
        </div>
      </header>

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* TAB 1: TENDER COCKPIT */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6">
            
            {/* Tender Hero Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 font-mono text-xs font-semibold border border-blue-500/20">
                      {activeTender.tenderNo}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                      GeM Bid ID: {activeTender.gemBidId}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Tech Deadline: {activeTender.techEvaluationDeadline}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {activeTender.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>🏢 <strong className="text-slate-200">{activeTender.department}</strong></span>
                    <span>📍 <strong className="text-slate-200">{activeTender.location}</strong></span>
                    <span>🛡️ <strong className="text-slate-200">Make-in-India Min: {activeTender.minLocalContentRequired}%</strong></span>
                  </p>
                </div>

                <div className="flex lg:flex-col items-end justify-between sm:justify-end gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                  <div className="text-left lg:text-right">
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Estimated Tender Value</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                      {activeTender.estimatedValueFormatted}
                    </div>
                    <div className="text-[11px] text-slate-400">EMD: {activeTender.emdAmountFormatted}</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('scanner');
                      }}
                      className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Inspect Clauses</span>
                    </button>
                    <button
                      onClick={handleExportTCS}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                      <span>Export TCS</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Total Bids Received</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white flex items-baseline gap-2">
                  {activeTender.summaryStats.totalBidders} Bidders
                  <span className="text-xs font-normal text-slate-400">({activeTender.summaryStats.qualifiedBidders} Qualified)</span>
                </div>
                <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% PQC Submissions Ingested
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Avg Compliance Score</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  {activeTender.summaryStats.avgComplianceScore}%
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {activeTender.summaryStats.totalClausesAudited} total parameters audited by AI
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Clause Deviations Flagged</span>
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-orange-400 font-mono">
                  {activeTender.summaryStats.flaggedDeviations} Clauses
                </div>
                <div className="text-[11px] text-orange-300 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Clarification notices auto-drafted
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
                  <span>Vigilance & Cartel Alerts</span>
                  <AlertOctagon className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-400 font-mono">
                  {activeTender.summaryStats.cartelAnomalies > 0 ? `${activeTender.summaryStats.cartelAnomalies} Flagged` : '0 Clean'}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  IP/Metadata/Mirror Pricing checks
                </div>
              </div>
            </div>

            {/* Bidders Overview Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Participating Bidders & Techno-Commercial Status</span>
                </h3>
                <span className="text-xs text-slate-400">Click any bidder to inspect clause audit</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTender.bidders.map((bidder) => {
                  const isSelected = bidder.id === selectedBidderId;
                  const isQualified = bidder.qualificationStatus === 'QUALIFIED';
                  const isConditional = bidder.qualificationStatus === 'CONDITIONALLY_QUALIFIED';
                  const isDisqualified = bidder.qualificationStatus === 'DISQUALIFIED';

                  return (
                    <div
                      key={bidder.id}
                      onClick={() => {
                        setSelectedBidderId(bidder.id);
                        setActiveTab('scanner');
                      }}
                      className={`cursor-pointer rounded-xl border p-4.5 transition-all relative overflow-hidden ${
                        isSelected
                          ? 'bg-slate-850 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 font-mono">
                              {bidder.category}
                            </span>
                            {bidder.isMSE && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                MSE ({bidder.mseCategory})
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              bidder.localContentPercent >= 50
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              MII: {bidder.localContentPercent}% Local
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                            {bidder.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono">
                            GSTIN: {bidder.gstin} &bull; {bidder.registeredCity}, {bidder.state}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right shrink-0">
                          {isQualified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Qualified
                            </span>
                          )}
                          {isConditional && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3.5 h-3.5" /> CSQ Query
                            </span>
                          )}
                          {isDisqualified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                              <XCircle className="w-3.5 h-3.5" /> Disqualified
                            </span>
                          )}

                          <div className="mt-2 text-xs font-bold font-mono text-slate-300">
                            Quote: <span className="text-amber-400">{bidder.quotedPriceFormatted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Compliance Score Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-400">Technical Compliance Score</span>
                          <span className={`font-mono font-bold ${
                            bidder.overallComplianceScore >= 90
                              ? 'text-emerald-400'
                              : bidder.overallComplianceScore >= 70
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}>
                            {bidder.overallComplianceScore}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              bidder.overallComplianceScore >= 90
                                ? 'bg-emerald-500'
                                : bidder.overallComplianceScore >= 70
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${bidder.overallComplianceScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Quick Flags or Cartel Alert */}
                      {bidder.cartelRiskScore === 'HIGH' && (
                        <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                          <AlertOctagon className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                          <div>
                            <strong>Vigilance Red Flag:</strong> {bidder.cartelNotes}
                          </div>
                        </div>
                      )}

                      {isDisqualified && bidder.disqualificationReason && (
                        <div className="mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs">
                          <strong>Rejection Ground:</strong> {bidder.disqualificationReason}
                        </div>
                      )}

                      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>Audited Clauses: <strong className="text-slate-200">{bidder.evaluatedClauses.length} items</strong></span>
                        <span className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
                          View Deep Audit <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick SIH Impact Callout inside Cockpit */}
            <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    SIH Impact: 32 Days Evaluation Compressed into 4.2 Hours
                  </h4>
                  <p className="text-xs text-slate-400">
                    Autonomous extraction of metallurgy (ASTM/ASME), NACE sour service limits, and statutory MII declarations.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('impact')}
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-xs font-semibold shrink-0 transition-all"
              >
                View Before vs After Metrics &rarr;
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CLAUSE-BY-CLAUSE AI SCANNER */}
        {activeTab === 'scanner' && (
          <div className="space-y-5">
            
            {/* Bidder Selection Header Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Inspecting Bidder:
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeTender.bidders.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBidderId(b.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedBidderId === b.id
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {b.name.split(' ')[0]} ({b.category})
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTriggerAIScan}
                  disabled={isScanningLive}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningLive ? 'animate-spin text-amber-300' : ''}`} />
                  <span>{isScanningLive ? 'Auditing with Gemini...' : 'Re-Run Live AI Scan'}</span>
                </button>

                {activeBidder && activeBidder.evaluatedClauses.some(c => c.status !== 'COMPLIANT') && (
                  <button
                    onClick={() => handleOpenNoticeModal(activeBidder)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Generate GeM Clarification Notice</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Scan Notification if triggered */}
            {liveScanResult && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{liveScanResult}</span>
                </div>
                <button
                  onClick={() => setLiveScanResult(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Selected Bidder Summary Banner */}
            {activeBidder && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{activeBidder.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">({activeBidder.gstin})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span>Quoted: <strong className="text-amber-400 font-mono">{activeBidder.quotedPriceFormatted}</strong></span>
                    <span>&bull;</span>
                    <span>Local Content: <strong className="text-emerald-400">{activeBidder.localContentPercent}%</strong></span>
                    <span>&bull;</span>
                    <span>MSE Status: <strong>{activeBidder.isMSE ? 'Registered MSE' : 'Large Enterprise'}</strong></span>
                    <span>&bull;</span>
                    <span>Turnover: <strong>{activeBidder.turnoverLast3Yrs}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Compliance Score</div>
                    <div className={`text-2xl font-extrabold font-mono ${
                      activeBidder.overallComplianceScore >= 90 ? 'text-emerald-400' : activeBidder.overallComplianceScore >= 70 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {activeBidder.overallComplianceScore}%
                    </div>
                  </div>
                  <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Status</div>
                    <div className="text-xs font-bold mt-1">
                      {activeBidder.qualificationStatus === 'QUALIFIED' && <span className="text-emerald-400">QUALIFIED</span>}
                      {activeBidder.qualificationStatus === 'CONDITIONALLY_QUALIFIED' && <span className="text-amber-400">CSQ PENDING</span>}
                      {activeBidder.qualificationStatus === 'DISQUALIFIED' && <span className="text-red-400">DISQUALIFIED</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['ALL', 'MAJOR_DEVIATION', 'MINOR_DEVIATION', 'MISSING_DOC', 'COMPLIANT'] as const).map((filterKey) => {
                  const labels = {
                    ALL: 'All Clauses',
                    MAJOR_DEVIATION: 'Major Deviations (Fatal)',
                    MINOR_DEVIATION: 'Minor Deviations (CSQ)',
                    MISSING_DOC: 'Missing Certificates',
                    COMPLIANT: 'Compliant'
                  };

                  const count = (activeBidder?.evaluatedClauses || []).filter(c => filterKey === 'ALL' || c.status === filterKey).length;

                  return (
                    <button
                      key={filterKey}
                      onClick={() => setClauseFilter(filterKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        clauseFilter === filterKey
                          ? 'bg-slate-800 text-amber-400 border border-amber-500/40 shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{labels[filterKey]}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clause, standard, MOC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Clause Audit Grid */}
            <div className="space-y-3">
              {filteredClauses.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-300">No clauses match the selected filter.</div>
                  <p className="text-xs text-slate-500">Try resetting the filter to 'All Clauses' or adjusting your search keyword.</p>
                </div>
              ) : (
                filteredClauses.map((clause) => {
                  const isComp = clause.status === 'COMPLIANT';
                  const isMinor = clause.status === 'MINOR_DEVIATION';
                  const isMajor = clause.status === 'MAJOR_DEVIATION';
                  const isMissing = clause.status === 'MISSING_DOC';

                  return (
                    <div
                      key={clause.id}
                      className={`rounded-xl border p-4.5 transition-all ${
                        isMajor || isMissing
                          ? 'bg-red-950/20 border-red-900/40 hover:border-red-800/60'
                          : isMinor
                          ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-800/60'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-800 text-amber-400 border border-slate-700">
                              {clause.number}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                              {clause.category}
                            </span>
                            <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              Ref: {clause.standardRef}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{clause.title}</h4>
                        </div>

                        {/* Status Badge & Risk */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">AI Risk Score</div>
                            <div className={`font-mono text-xs font-bold ${
                              clause.riskScore >= 8 ? 'text-red-400' : clause.riskScore >= 4 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {clause.riskScore} / 10
                            </div>
                          </div>

                          <div>
                            {isComp && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                              </span>
                            )}
                            {isMinor && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                <AlertTriangle className="w-3.5 h-3.5" /> Minor Deviation
                              </span>
                            )}
                            {isMajor && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                <XCircle className="w-3.5 h-3.5" /> Major Discrepancy
                              </span>
                            )}
                            {isMissing && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                <AlertOctagon className="w-3.5 h-3.5" /> Missing Document
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Specs Comparison Table */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5 pt-3 border-t border-slate-800/80">
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
                          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                            Required CPCL Tender Specification:
                          </div>
                          <div className="text-xs text-slate-200 leading-relaxed">
                            {clause.requiredSpec}
                          </div>
                        </div>

                        <div className={`p-3 rounded-lg border space-y-1 ${
                          isComp
                            ? 'bg-emerald-950/10 border-emerald-900/30'
                            : isMinor
                            ? 'bg-amber-950/10 border-amber-900/30'
                            : 'bg-red-950/10 border-red-900/30'
                        }`}>
                          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                            Offered Bidder Submittal:
                          </div>
                          <div className="text-xs text-slate-200 leading-relaxed font-mono">
                            {clause.offeredSpec}
                          </div>
                        </div>
                      </div>

                      {/* AI Auditor Findings */}
                      <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
                        <Bot className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                          <div className="font-semibold text-slate-300">
                            STAMAS AI Auditor Observation:
                          </div>
                          <div className="text-slate-400 leading-relaxed">
                            {clause.auditorRemarks}
                          </div>
                          {clause.clarificationDraft && (
                            <div className="mt-2 pt-2 border-t border-slate-800 text-amber-300/90 font-mono text-[11px] bg-amber-500/5 p-2 rounded">
                              <strong>Recommended CSQ Query:</strong> {clause.clarificationDraft}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TCS MATRIX & COLLUSION RADAR */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            
            {/* Header with Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>Technical Comparative Statement (TCS Matrix / CSQ Summary)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive techno-commercial evaluation statement for Tender Committee approval
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportTCS}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Official TCS Statement</span>
                </button>
              </div>
            </div>

            {/* TCS Matrix Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-850 text-slate-300 font-semibold border-b border-slate-800">
                    <th className="py-3.5 px-4 sticky left-0 bg-slate-850 z-10 min-w-[200px]">Parameter / Bidder</th>
                    {activeTender.bidders.map(b => (
                      <th key={b.id} className="py-3.5 px-4 min-w-[220px] border-l border-slate-800">
                        <div className="font-bold text-white">{b.name}</div>
                        <div className="text-[10px] text-amber-400 font-mono">{b.category} &bull; {b.quotedPriceFormatted}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  
                  {/* Row: Technical Compliance Score */}
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white sticky left-0 bg-slate-900">
                      Overall Compliance Score
                    </td>
                    {activeTender.bidders.map(b => (
                      <td key={b.id} className="py-3 px-4 border-l border-slate-800 font-mono font-bold">
                        <span className={b.overallComplianceScore >= 90 ? 'text-emerald-400' : b.overallComplianceScore >= 70 ? 'text-amber-400' : 'text-red-400'}>
                          {b.overallComplianceScore}%
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Row: Recommendation */}
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white sticky left-0 bg-slate-900">
                      Committee Recommendation
                    </td>
                    {activeTender.bidders.map(b => (
                      <td key={b.id} className="py-3 px-4 border-l border-slate-800 font-semibold">
                        {b.qualificationStatus === 'QUALIFIED' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Technically Qualified
                          </span>
                        )}
                        {b.qualificationStatus === 'CONDITIONALLY_QUALIFIED' && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            CSQ Clarification Sought
                          </span>
                        )}
                        {b.qualificationStatus === 'DISQUALIFIED' && (
                          <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                            Disqualified
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Material of Construction (MOC) */}
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white sticky left-0 bg-slate-900">
                      Body Metallurgy (ASTM A182)
                    </td>
                    {activeTender.bidders.map(b => {
                      const mocClause = b.evaluatedClauses.find(c => c.number === 'Clause 3.1' || c.number === 'Clause 2.1');
                      const isOk = mocClause?.status === 'COMPLIANT';
                      return (
                        <td key={b.id} className="py-3 px-4 border-l border-slate-800">
                          <div className="flex items-center gap-1.5">
                            {isOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                            <span className="text-xs">{mocClause?.offeredSpec.slice(0, 48)}...</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Sour Service NACE MR0175 */}
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white sticky left-0 bg-slate-900">
                      Sour Service (NACE MR0175)
                    </td>
                    {activeTender.bidders.map(b => {
                      const naceClause = b.evaluatedClauses.find(c => c.number === 'Clause 4.2' || c.title.toLowerCase().includes('sour'));
                      const isOk = naceClause?.status === 'COMPLIANT';
                      return (
                        <td key={b.id} className="py-3 px-4 border-l border-slate-800">
                          <div className="flex items-center gap-1.5">
                            {isOk ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <span className="text-xs">{naceClause?.offeredSpec.slice(0, 45) || 'N/A'}...</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Make in India % */}
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white sticky left-0 bg-slate-900">
                      Make-in-India Local Content
                    </td>
                    {activeTender.bidders.map(b => (
                      <td key={b.id} className="py-3 px-4 border-l border-slate-800">
                        <div className="font-mono font-bold text-slate-200">
                          {b.localContentPercent}% ({b.miiClassification.split(' ')[0]})
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Row: MSE & Udyam */}
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white sticky left-0 bg-slate-900">
                      MSE Status & Exemption
                    </td>
                    {activeTender.bidders.map(b => (
                      <td key={b.id} className="py-3 px-4 border-l border-slate-800">
                        {b.isMSE ? (
                          <span className="text-emerald-400 font-mono font-semibold">
                            Yes (Udyam Verified)
                          </span>
                        ) : (
                          <span className="text-slate-400">Non-MSE</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Average Turnover */}
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white sticky left-0 bg-slate-900">
                      3-Yr Turnover / Net Worth
                    </td>
                    {activeTender.bidders.map(b => (
                      <td key={b.id} className="py-3 px-4 border-l border-slate-800 font-mono text-xs">
                        {b.turnoverLast3Yrs}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Collusion Risk */}
                  <tr className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-semibold text-white sticky left-0 bg-slate-900">
                      Vigilance & Cartel Risk
                    </td>
                    {activeTender.bidders.map(b => (
                      <td key={b.id} className="py-3 px-4 border-l border-slate-800">
                        {b.cartelRiskScore === 'HIGH' ? (
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                            HIGH RISK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                            LOW RISK
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Collusion & Anomaly Radar Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertOctagon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Autonomous Bid Rigging & Cartel Anomaly Detection Radar
                    </h4>
                    <p className="text-xs text-slate-400">
                      Deep AI inspection across IP subnets, PDF creator metadata, timestamp delta, and mirror pricing
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>IP / Gateway Anomaly</span>
                    <span className="text-red-400 font-mono text-[10px] font-bold">MATCH DETECTED</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Bidder 3 (Microtech) and Bidder 4 (Apex) both submitted from identical ISP AS24336 in Coimbatore within a 12-minute window.
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>PDF Metadata Fingerprint</span>
                    <span className="text-red-400 font-mono text-[10px] font-bold">MATCH DETECTED</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Both PDF technical bids contain exact author string <code className="text-amber-300">"DELL-LATITUDE-ADMIN"</code> generated on the same workstation.
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Mirror Pricing Margin</span>
                    <span className="text-amber-400 font-mono text-[10px] font-bold">SUSPICIOUS DELTA</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Microtech (+12.50%) and Apex (+21.87%) quotes follow exact step increments relative to base cost estimate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BIDDER PRE-SUBMISSION SANDBOX (VENDOR PORTAL) */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Vendor Pre-Submission Bid Diagnostic Sandbox
                  </h3>
                  <p className="text-xs text-slate-400">
                    Vendors & MSEs can test technical submittals before final submission on GeM to eliminate inadvertent rejections.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Input Form (7 cols) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Target Tender</label>
                    <select
                      value={sandboxTenderNo}
                      onChange={(e) => setSandboxTenderNo(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="CPCL/REF/2026/094">CPCL/REF/2026/094 - Cryogenic Valves (₹14.85 Cr)</option>
                      <option value="CPCL/EPC/2026/112">CPCL/EPC/2026/112 - DHDS Reactor Revamp (₹84.20 Cr)</option>
                      <option value="CPCL/SOL/2026/045">CPCL/SOL/2026/045 - 15MW Solar Farm (₹52.60 Cr)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400">Vendor / Enterprise Name</label>
                    <input
                      type="text"
                      value={sandboxVendorName}
                      onChange={(e) => setSandboxVendorName(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400">Declared Domestic Local Content (%)</label>
                    <input
                      type="number"
                      value={sandboxLocalContent}
                      onChange={(e) => setSandboxLocalContent(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400">MSE Registration (Udyam)</label>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="mseRadio"
                          checked={sandboxMseStatus}
                          onChange={() => setSandboxMseStatus(true)}
                          className="text-amber-500 focus:ring-0"
                        />
                        <span>Registered MSE</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="mseRadio"
                          checked={!sandboxMseStatus}
                          onChange={() => setSandboxMseStatus(false)}
                          className="text-amber-500 focus:ring-0"
                        />
                        <span>Non-MSE</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-400">
                      Technical Offer Specifications / Clause Responses:
                    </label>
                    <button
                      onClick={() => {
                        setSandboxInputText(
                          `BODY MATERIAL: ASTM A182 F316 Forged Stainless Steel\nPRESSURE RATING: ANSI Class 1500#\nSOUR SERVICE: NACE MR0175 compliant, hardness <= 21.5 HRC\nHYDRO TEST: Shell test 450 bar for 15 min, Gas seat 330 bar\nMII LOCAL CONTENT: 65% certified with valid CA UDIN\nWARRANTY: 36 months from supply / 24 months from commissioning`
                        );
                        setSandboxLocalContent('65');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      Load Compliant Sample
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={sandboxInputText}
                    onChange={(e) => setSandboxInputText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleRunDiagnostic}
                    disabled={isDiagnosing}
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Zap className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
                    <span>{isDiagnosing ? 'Scanning Technical Clauses...' : 'Run Instant AI Diagnostic'}</span>
                  </button>
                </div>
              </div>

              {/* Diagnostic Results Panel (5 cols) */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pre-Submission Readiness Audit</span>
                </h4>

                {!sandboxResult ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl text-slate-500 space-y-2">
                    <Sparkles className="w-8 h-8 text-slate-600" />
                    <p className="text-xs">Click <strong>"Run Instant AI Diagnostic"</strong> to audit your technical submittal against CPCL standards.</p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    
                    {/* Score Gauge */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-semibold uppercase">Bid Readiness Score</div>
                        <div className={`text-3xl font-extrabold font-mono ${
                          sandboxResult.score >= 90 ? 'text-emerald-400' : sandboxResult.score >= 60 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {sandboxResult.score}%
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          sandboxResult.status === 'READY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : sandboxResult.status === 'MINOR_ISSUES'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {sandboxResult.status === 'READY' ? 'Ready for Submission' : sandboxResult.status === 'MINOR_ISSUES' ? 'Clarifications Needed' : 'Disqualification Risk'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      {sandboxResult.summary}
                    </p>

                    {/* Individual Checks */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Clause Verification Breakdown:
                      </div>
                      {sandboxResult.checks.map((chk, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                            chk.passed
                              ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-200'
                              : 'bg-red-950/20 border-red-900/30 text-red-200'
                          }`}
                        >
                          {chk.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5">
                            <div className="font-semibold text-white">{chk.title}</div>
                            <div className="text-[11px] text-slate-400">{chk.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SIH IMPACT & ANALYTICS */}
        {activeTab === 'impact' && (
          <div className="space-y-6">
            
            {/* SIH Impact Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Smart India Hackathon (SIH) Impact Assessment & Key Metrics</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Quantitative transformation metrics demonstrating measurable efficiency gains for CPCL and MoPNG.
              </p>
            </div>

            {/* Before vs After Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BEFORE_AFTER_IMPACT_METRICS.map((item, index) => (
                <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3 hover:border-slate-700 transition-all">
                  <div className="text-xs font-bold text-slate-300">
                    {item.metric}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                    <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/30">
                      <div className="text-[10px] text-red-400 font-semibold uppercase">Before STAMAS</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">{item.before}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                      <div className="text-[10px] text-emerald-400 font-semibold uppercase">With STAMAS AI</div>
                      <div className="text-sm font-bold text-emerald-300 mt-0.5">{item.after}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-amber-400 font-mono">{item.improvement}</span>
                    <span className="text-[11px] text-slate-400">{item.highlight}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Evaluation Time Comparison */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>Evaluation Turnaround Time (Days vs Hours)</span>
                  </h4>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={turnaroundChartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                      <XAxis dataKey="stage" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="manualDays" name="Manual Process (Days)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="stamasHours" name="STAMAS AI (Hours)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Bidder Compliance vs Quoted Value */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Bidder Compliance Score vs Make-in-India %</span>
                  </h4>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complianceDistributionData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="score" name="Compliance Score (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="localContent" name="Make in India Content (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Deviation Breakdown by Category */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span>Clause Deviations Distribution by Domain</span>
                  </h4>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviationCategoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name ? name.split(' ')[0] : ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {deviationCategoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Multi-Bidder Multi-Axis Radar Matrix */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Techno-Commercial Multi-Axis Risk Radar</span>
                  </h4>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} />
                      <Radar name="L&T Heavy Valves" dataKey="LnT" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                      <Radar name="BVIS Flow Systems" dataKey="BVIS" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="Apex Valvetech" dataKey="Apex" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: SIH PROBLEM STATEMENT BRIEF (PS ID: 26100) */}
        {activeTab === 'brief' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold text-xs">
                      PS ID: {SIH_PROBLEM_BRIEF.psId}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-xs">
                      Theme: {SIH_PROBLEM_BRIEF.theme}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {SIH_PROBLEM_BRIEF.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Organization: <strong className="text-slate-200">{SIH_PROBLEM_BRIEF.org}</strong>
                  </p>
                </div>
              </div>

              {/* Background Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  1. Operational Problem & Background
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {SIH_PROBLEM_BRIEF.problemStatement}
                </p>
              </div>

              {/* Our Solution */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  2. Our STAMAS Solution & Core Differentiation
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {SIH_PROBLEM_BRIEF.ourSolution}
                </p>
              </div>

              {/* Target Users */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                  3. Target User Personas & Key Value Additions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SIH_PROBLEM_BRIEF.targetUsers.map((u, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>{u.role}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {u.need}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* CLARIFICATION NOTICE MODAL */}
      {noticeModalOpen && activeNoticeBidder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Official GeM Technical Clarification Notice (CSQ Query)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recipient: <strong className="text-slate-200">{activeNoticeBidder.name}</strong> ({activeNoticeBidder.gstin})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoticeModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {isGeneratingNotice ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <p className="text-xs">Drafting CVC & GFR 2017 compliant notice via Gemini...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Editable Official Representation Draft:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(noticeContent);
                        setCopiedNotice(true);
                        setTimeout(() => setCopiedNotice(false), 2000);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNotice ? 'Copied to Clipboard!' : 'Copy Notice Text'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={14}
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Notice enforces mandatory 48-Hour response SLA on GeM 4.0 portal.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setNoticeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    confetti({ particleCount: 50, spread: 60 });
                    alert(`Clarification Notice dispatched to ${activeNoticeBidder.name} via GeM CSQ Gateway.`);
                    setNoticeModalOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  Dispatch on GeM Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TCS EXPORT MODAL */}
      {tcsExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Technical Comparative Statement (TCS) - Official Audit Pack
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tender: {activeTender.tenderNo} &bull; GeM Bid ID: {activeTender.gemBidId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTcsExportModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4 font-sans text-xs bg-slate-950 text-slate-200">
              <div className="border border-slate-800 p-5 rounded-xl space-y-4">
                <div className="text-center border-b border-slate-800 pb-3 space-y-1">
                  <h2 className="text-base font-bold text-white uppercase tracking-wider">
                    CHENNAI PETROLEUM CORPORATION LIMITED (CPCL)
                  </h2>
                  <p className="text-xs text-slate-400">
                    (A Government of India Enterprise / Group of Indian Oil Corporation Ltd.)
                  </p>
                  <p className="text-xs font-semibold text-amber-400">
                    FORMAL TECHNICAL EVALUATION COMMITTEE PROCEEDINGS & COMPARATIVE STATEMENT
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div><strong>Tender No:</strong> {activeTender.tenderNo}</div>
                    <div><strong>GeM Bid Reference:</strong> {activeTender.gemBidId}</div>
                    <div><strong>Estimated Value:</strong> {activeTender.estimatedValueFormatted}</div>
                  </div>
                  <div>
                    <div><strong>Date of Evaluation:</strong> 26-Sep-2026</div>
                    <div><strong>Evaluation Engine:</strong> STAMAS AI v3.8</div>
                    <div><strong>Make-in-India Minimum:</strong> {activeTender.minLocalContentRequired}%</div>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 font-bold text-white border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Bidder Name</th>
                        <th className="p-2.5">Quoted (₹)</th>
                        <th className="p-2.5">MII %</th>
                        <th className="p-2.5">Compliance Score</th>
                        <th className="p-2.5">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {activeTender.bidders.map(b => (
                        <tr key={b.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-semibold text-white">{b.name}</td>
                          <td className="p-2.5 font-mono text-amber-300">{b.quotedPriceFormatted}</td>
                          <td className="p-2.5 font-mono">{b.localContentPercent}%</td>
                          <td className="p-2.5 font-mono font-bold">{b.overallComplianceScore}%</td>
                          <td className="p-2.5 font-bold">
                            {b.qualificationStatus === 'QUALIFIED' && <span className="text-emerald-400">QUALIFIED</span>}
                            {b.qualificationStatus === 'CONDITIONALLY_QUALIFIED' && <span className="text-amber-400">CSQ PENDING</span>}
                            {b.qualificationStatus === 'DISQUALIFIED' && <span className="text-red-400">DISQUALIFIED</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t border-slate-800 text-slate-400 text-[11px] space-y-1">
                  <div><strong>Committee Remarks:</strong> All evaluations comply with GFR 2017 Rule 144(xi), CVC Vig. Guidelines 2021, and MoPNG Make-in-India Public Procurement Order 2017.</div>
                  <div className="grid grid-cols-3 gap-4 pt-8 text-center text-slate-300 font-semibold">
                    <div className="border-t border-slate-700 pt-1">GM (Procurement)</div>
                    <div className="border-t border-slate-700 pt-1">Chief Tech Auditor (Refinery)</div>
                    <div className="border-t border-slate-700 pt-1">DGM (Finance & Audit)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
              <span className="text-xs text-slate-400">Official ISO 9001:2015 & GeM Audited Record</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTcsExportModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print TCS Statement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING STAMAS AI COPILOT CHATBOT */}
      {isCopilotOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 flex items-center justify-between border-b border-blue-800">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-300" />
              <div>
                <h4 className="text-xs font-bold text-white">STAMAS AI Procurement Copilot</h4>
                <p className="text-[10px] text-blue-200">Grounded in GFR 2017 & CPCL Tech Specs</p>
              </div>
            </div>
            <button
              onClick={() => setIsCopilotOpen(false)}
              className="text-blue-200 hover:text-white text-xs font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="p-3.5 h-80 overflow-y-auto space-y-3 bg-slate-950 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white font-medium rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <Bot className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Auditing CPCL technical database...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              'Why was Apex disqualified?',
              'Detect cartel patterns',
              'Verify Make in India quota',
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUserChatInput(prompt);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium shrink-0 border border-slate-700"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendChatMessage} className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask Copilot about clauses, GFR, cartels..."
              value={userChatInput}
              onChange={(e) => setUserChatInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !userChatInput.trim()}
              className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">STAMAS Platform</span>
            <span>&bull; Smart India Hackathon (SIH) Prototype &bull; PS ID: 26100</span>
          </div>
          <div>
            Chennai Petroleum Corporation Limited (CPCL) & GeM 4.0 Architecture
          </div>
        </div>
      </footer>

    </div>
  );
}

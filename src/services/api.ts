import { Tender, Bidder, Clause } from '../data/tenderData';

export const apiClient = {
  // Fetch all tenders from Node.js backend
  async getTenders(): Promise<Tender[]> {
    try {
      const res = await fetch('/api/tenders');
      const data = await res.json();
      return data?.data || [];
    } catch (err) {
      console.warn('API getTenders fallback to local data', err);
      return [];
    }
  },

  // Create tender
  async createTender(tenderData: Partial<Tender>): Promise<Tender | null> {
    try {
      const res = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenderData)
      });
      const data = await res.json();
      return data?.data || null;
    } catch (err) {
      console.error('Failed to create tender', err);
      return null;
    }
  },

  // Ingest bidder into tender
  async ingestBidder(tenderId: string, bidderData: any): Promise<any> {
    try {
      const res = await fetch(`/api/tenders/${tenderId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidderData)
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to ingest bidder', err);
      return null;
    }
  },

  // Deep AI Clause Verification
  async verifyBid(tenderDetails: any, bidderDetails: any, clausesToVerify: Clause[]) {
    try {
      const res = await fetch('/api/gemini/verify-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderDetails, bidderDetails, clausesToVerify })
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to verify bid with Gemini', err);
      return null;
    }
  },

  // Clarification Notice Generator
  async generateNotice(tenderNo: string, tenderTitle: string, bidderName: string, deviations: any[], contactOfficer?: string) {
    try {
      const res = await fetch('/api/gemini/generate-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderNo, tenderTitle, bidderName, deviations, contactOfficer })
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to generate notice', err);
      return null;
    }
  },

  // Copilot Chat
  async sendCopilotChat(message: string, tenderContext: any) {
    try {
      const res = await fetch('/api/gemini/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, tenderContext })
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to query copilot', err);
      return null;
    }
  },

  // Cartel Detection
  async detectCartel(tenderId: string) {
    try {
      const res = await fetch('/api/gemini/detect-cartel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId })
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to detect cartel', err);
      return null;
    }
  },

  // System Health
  async getSystemHealth() {
    try {
      const res = await fetch('/api/system/health');
      return await res.json();
    } catch (err) {
      return null;
    }
  }
};

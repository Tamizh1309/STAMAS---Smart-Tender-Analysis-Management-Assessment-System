import { Router } from 'express';
import { db } from '../db/dbConnector.ts';

export const tenderRouter = Router();

// GET all tenders
tenderRouter.get('/', async (req, res) => {
  try {
    const tenders = await db.getAllTenders();
    return res.status(200).json({ success: true, data: tenders, count: tenders.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET single tender
tenderRouter.get('/:id', async (req, res) => {
  try {
    const tender = await db.getTenderById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, error: 'Tender not found' });
    }
    return res.status(200).json({ success: true, data: tender });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST new tender
tenderRouter.post('/', async (req, res) => {
  try {
    const { title, tenderNo } = req.body;
    if (!title || !tenderNo) {
      return res.status(400).json({ success: false, error: 'Tender title and number are mandatory.' });
    }
    const newTender = await db.createTender(req.body);
    return res.status(201).json({ success: true, data: newTender, message: 'Tender registered in GeM database.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST ingest new bidder into tender
tenderRouter.post('/:id/bids', async (req, res) => {
  try {
    const result = await db.addBidderToTender(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Tender not found' });
    }
    return res.status(201).json({
      success: true,
      data: result.bidder,
      tenderSummary: result.tender.summaryStats,
      message: `Bidder "${result.bidder.name}" audited and ingested.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

import express from 'express';
import { prisma } from '../db';

const router = express.Router();

// Get all states
router.get('/states', async (req, res) => {
  try {
    const states = await prisma.state.findMany();
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// Get districts by state
router.get('/states/:stateId/districts', async (req, res) => {
  try {
    const districts = await prisma.district.findMany({
      where: { stateId: req.params.stateId },
    });
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// Get mandals by district
router.get('/districts/:districtId/mandals', async (req, res) => {
  try {
    const mandals = await prisma.mandal.findMany({
      where: { districtId: req.params.districtId },
    });
    res.json(mandals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mandals' });
  }
});

// Get villages by mandal
router.get('/mandals/:mandalId/villages', async (req, res) => {
  try {
    const villages = await prisma.village.findMany({
      where: { mandalId: req.params.mandalId },
    });
    res.json(villages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch villages' });
  }
});

// Get all parties
router.get('/parties', async (req, res) => {
  try {
    const parties = await prisma.party.findMany();
    res.json(parties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parties' });
  }
});

export default router;

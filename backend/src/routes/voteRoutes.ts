import express from 'express';
import { Server } from 'socket.io';
import { prisma } from '../db';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Increased rate limiter for simulation purposes
const rateLimiter = new RateLimiterMemory({
  points: 1000,
  duration: 60,
});

export default function voteRoutes(io: Server) {
  const router = express.Router();

  // Submit a vote
  router.post('/', async (req, res) => {
    try {
      // Rate limiting
      await rateLimiter.consume(req.ip || '127.0.0.1');

      const { villageId, partyId, voterId } = req.body;

      if (!villageId || !partyId || !voterId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if user already voted (idempotency/fraud check)
      const existingVote = await prisma.vote.findUnique({
        where: { voterId },
      });

      if (existingVote) {
        return res.status(409).json({ error: 'Voter has already cast a vote' });
      }

      // Save vote
      const vote = await prisma.vote.create({
        data: {
          villageId,
          partyId,
          voterId,
        },
        include: {
          party: true,
          village: {
            include: {
              mandal: {
                include: {
                  district: true,
                }
              }
            }
          }
        }
      });

      // Broadcast new vote for real-time updates
      io.emit('new_vote', {
        id: vote.id,
        party: vote.party.name,
        partyId: vote.partyId,
        villageId: vote.villageId,
        mandalId: vote.village.mandalId,
        districtId: vote.village.mandal.districtId,
        stateId: vote.village.mandal.district.stateId,
      });

      res.status(201).json({ message: 'Vote recorded successfully', voteId: vote.id });
    } catch (error: any) {
      if (error.name === 'Error' && error.message.includes('rate limiter')) { // naive check
         return res.status(429).json({ error: 'Too many requests' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get aggregated results for a specific geography level
  router.get('/results', async (req, res) => {
    const { stateId, districtId, mandalId, villageId } = req.query;

    try {
      // Build filter
      let villageFilter: any = {};
      if (villageId) {
        villageFilter.id = villageId as string;
      } else if (mandalId) {
        villageFilter.mandalId = mandalId as string;
      } else if (districtId) {
        villageFilter.mandal = { districtId: districtId as string };
      } else if (stateId) {
        villageFilter.mandal = { district: { stateId: stateId as string } };
      }

      // Aggregate votes grouped by party
      const votes = await prisma.vote.groupBy({
        by: ['partyId'],
        where: {
          village: villageFilter
        },
        _count: {
          _all: true,
        },
      });

      // Fetch party details to format response
      const parties = await prisma.party.findMany();
      
      const results = parties.map(party => {
        const partyVotes = votes.find(v => v.partyId === party.id);
        return {
          id: party.id,
          name: party.name,
          color: party.color,
          votes: partyVotes ? partyVotes._count._all : 0
        };
      });

      const totalVotes = results.reduce((acc, curr) => acc + curr.votes, 0);

      const finalResults = results.map(r => ({
        ...r,
        percentage: totalVotes > 0 ? ((r.votes / totalVotes) * 100).toFixed(2) : 0
      }));

      res.json({
        totalVotes,
        results: finalResults.sort((a, b) => b.votes - a.votes)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch results' });
    }
  });

  return router;
}

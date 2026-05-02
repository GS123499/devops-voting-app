import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const prisma = new PrismaClient();

const AP_DATA = {
  name: 'Andhra Pradesh',
  districts: [
    {
      name: 'Visakhapatnam',
      mandals: [
        { name: 'Bheemunipatnam', villages: ['Anandapuram', 'Bheemili'] },
        { name: 'Gajuwaka', villages: ['Kurmannapalem', 'Mindi'] }
      ]
    },
    {
      name: 'Krishna',
      mandals: [
        { name: 'Vijayawada Rural', villages: ['Nidamanuru', 'Prasadampadu'] },
        { name: 'Machilipatnam', villages: ['Chilakalapudi', 'Guduru'] }
      ]
    }
  ]
};

const PARTIES = [
  { name: 'GKP', color: '#FF9933' },
  { name: 'JSP', color: '#CC0000' },
  { name: 'Others', color: '#808080' }
];

async function seedData() {
  console.log('Seeding Geographical and Party data...');
  
  // Create State
  const state = await prisma.state.upsert({
    where: { name: AP_DATA.name },
    update: {},
    create: { name: AP_DATA.name }
  });

  // Create Parties
  for (const p of PARTIES) {
    await prisma.party.upsert({
      where: { name: p.name },
      update: {},
      create: p
    });
  }

  // Create Geography Hierarchy
  for (const d of AP_DATA.districts) {
    const district = await prisma.district.upsert({
      where: { name: d.name },
      update: {},
      create: { name: d.name, stateId: state.id }
    });

    for (const m of d.mandals) {
      // Assuming mandal names are unique for simulation
      let mandal = await prisma.mandal.findFirst({ where: { name: m.name } });
      if (!mandal) {
        mandal = await prisma.mandal.create({
          data: { name: m.name, districtId: district.id }
        });
      }

      for (const v of m.villages) {
        await prisma.village.create({
          data: { name: v, mandalId: mandal.id }
        });
      }
    }
  }
  console.log('Seeding complete.');
}

async function simulateVotes(count: number) {
  console.log(`Starting vote simulation: ${count} votes...`);
  const villages = await prisma.village.findMany();
  const parties = await prisma.party.findMany();

  if (villages.length === 0 || parties.length === 0) {
    console.error('Run seed function first.');
    return;
  }

  for (let i = 0; i < count; i++) {
    const randomVillage = villages[Math.floor(Math.random() * villages.length)];
    // Weighted probabilities could be added here
    const randomParty = parties[Math.floor(Math.random() * parties.length)];
    const voterId = uuidv4(); // Simulated unique voter

    try {
      await axios.post('http://localhost:3001/api/votes', {
        villageId: randomVillage.id,
        partyId: randomParty.id,
        voterId
      });
      console.log(`Vote ${i + 1}/${count} recorded for ${randomParty.name} in ${randomVillage.name}`);
    } catch (e: any) {
      console.log('Error recording vote:', e.response?.data || e.message);
    }
    
    // Add small delay to avoid overwhelming the naive rate limiter too quickly
    await new Promise(res => setTimeout(res, 200)); 
  }
}

async function run() {
  const arg = process.argv[2];
  if (arg === 'seed') {
    await seedData();
  } else if (arg === 'simulate') {
    const count = parseInt(process.argv[3] || '50', 10);
    await simulateVotes(count);
  } else {
    console.log('Usage: ts-node simulate.ts seed | simulate [count]');
  }
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

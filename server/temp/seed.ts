require('dotenv').config();

import { ObjectId } from 'mongodb';
import { connectDatabase } from '../src/database';
import { listings, users } from './data';

const seed = async () => {
  try {
    console.log(`[seed] : running…`);

    const db = await connectDatabase();

    for (const listing of listings) {
      await db.listings.insertOne(listing);
    }

    for (const user of users) {
      await db.users.insertOne(user);
    }
    console.log(`[seed] : success`);
    process.exit(0);
  } catch (error) {
    throw new Error('failed to seed database');
  }
};

seed();

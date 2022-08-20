import { IResolvers } from 'apollo-server-express';
import { Request } from 'express';
import { ObjectId } from 'mongodb';
import { Stripe } from '../../../lib/api';
import {
  Booking,
  BookingsIndex,
  Database,
  Listing,
  User,
} from '../../../lib/types';
import { authorize } from '../../../lib/utils';
import { CreateBookingInput } from './types';

const resolveBookingsIndex = (
  bookingsIndex: BookingsIndex,
  checkInDate: string,
  checkOutDate: string
): BookingsIndex => {
  let dateCursor = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const newBookingsIndex: BookingsIndex = { ...bookingsIndex };

  while (dateCursor <= checkOut) {
    const y = dateCursor.getUTCFullYear();
    const m = dateCursor.getUTCMonth();
    const d = dateCursor.getUTCDate();

    if (!newBookingsIndex[y]) {
      newBookingsIndex[y] = { ...bookingsIndex[y] };
    }

    if (!newBookingsIndex[y][m]) {
      newBookingsIndex[y][m] = { ...bookingsIndex[y][m] };
    }

    if (!newBookingsIndex[y][m][d]) {
      newBookingsIndex[y][m][d] = true;
    } else {
      throw new Error(
        'selected dates cannot overlap dates that have already been booked'
      );
    }

    dateCursor = new Date(dateCursor.getTime() * 1000 * 60 * 60 * 24);
  }

  return newBookingsIndex;
};

export const bookingResolvers: IResolvers = {
  Mutation: {
    createBooking: async (
      _root: undefined,
      { input }: CreateBookingInput,
      { db, req }: { db: Database; req: Request }
    ): Promise<Booking> => {
      try {
        const { id, source, checkIn, checkOut } = input;

        const viewer = await authorize(db, req);
        if (!viewer) {
          throw new Error('Viewer cannot be found');
        }

        const listing = await db.listings.findOne({ _id: new ObjectId(id) });
        if (!listing) {
          throw new Error('Listing cannot be found');
        }

        if (listing.host === viewer._id) {
          throw new Error('Viewer cannot book own listing');
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkOutDate < checkInDate) {
          throw new Error('Check out date must be after check in date');
        }

        const bookingsIndex = resolveBookingsIndex(
          listing.bookingsIndex,
          checkIn,
          checkOut
        );

        const totalPrice =
          (listing.price * (checkOutDate.getTime() - checkInDate.getTime())) /
          1000 /
          60 /
          60 /
          24;

        const host = await db.users.findOne({ _id: listing.host });

        if (!host || !host.walletId) {
          throw new Error(
            'The host cannot be found or is not connected with Stripe'
          );
        }

        await Stripe.charge(totalPrice, source, host.walletId);

        const toInsert = {
          _id: new ObjectId(),
          listing: listing._id,
          tenant: viewer._id,
          checkIn,
          checkOut,
        };
        const insertResult = await db.bookings.findOneAndUpdate(
          { _id: new ObjectId() },
          { $setOnInsert: toInsert },
          { upsert: true, returnDocument: 'after' }
        );
        const insertedBooking: Booking | null = insertResult.value;

        if (!insertedBooking) {
          throw new Error('Failed to create booking');
        }

        await db.users.updateOne(
          {
            _id: host._id,
          },
          {
            $inc: { income: totalPrice },
          }
        );

        await db.users.updateOne(
          {
            _id: viewer._id,
          },
          {
            $push: { bookings: insertedBooking._id },
          }
        );

        await db.listings.updateOne(
          {
            _id: listing._id,
          },
          {
            $set: { bookingsIndex },
            $push: { bookings: insertedBooking?._id },
          }
        );

        return insertedBooking;
      } catch (error) {
        throw new Error(`Failed to create booking: ${error}`);
      }
    },
  },
  Booking: {
    id: (booking: Booking): string => booking._id.toString(),
    listing: (
      booking: Booking,
      _args: Record<string, unknown>,
      { db }: { db: Database }
    ): Promise<Listing | null> => db.listings.findOne({ _id: booking.listing }),
    tenant: (
      booking: Booking,
      _args: Record<string, unknown>,
      { db }: { db: Database }
    ): Promise<User | null> => db.users.findOne({ _id: booking.tenant }),
  },
};

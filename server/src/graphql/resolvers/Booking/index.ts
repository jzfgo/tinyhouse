import { IResolvers } from 'apollo-server-express';
import { Booking, Database, Listing } from '../../../lib/types';

export const bookingResolvers: IResolvers = {
  Booking: {
    id: (booking: Booking): string => booking._id.toString(),
    listing: (
      booking: Booking,
      _args: Record<string, unknown>,
      { db }: { db: Database }
    ): Promise<Listing | null> => db.listings.findOne({ _id: booking.listing }),
  },
};

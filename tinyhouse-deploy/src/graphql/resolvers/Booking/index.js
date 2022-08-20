"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingResolvers = void 0;
const mongodb_1 = require("mongodb");
const api_1 = require("../../../lib/api");
const utils_1 = require("../../../lib/utils");
const resolveBookingsIndex = (bookingsIndex, checkInDate, checkOutDate) => {
    let dateCursor = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const newBookingsIndex = Object.assign({}, bookingsIndex);
    while (dateCursor <= checkOut) {
        const y = dateCursor.getUTCFullYear();
        const m = dateCursor.getUTCMonth();
        const d = dateCursor.getUTCDate();
        if (!newBookingsIndex[y]) {
            newBookingsIndex[y] = Object.assign({}, bookingsIndex[y]);
        }
        if (!newBookingsIndex[y][m]) {
            newBookingsIndex[y][m] = Object.assign({}, bookingsIndex[y][m]);
        }
        if (!newBookingsIndex[y][m][d]) {
            newBookingsIndex[y][m][d] = true;
        }
        else {
            throw new Error('selected dates cannot overlap dates that have already been booked');
        }
        dateCursor = new Date(dateCursor.getTime() * 1000 * 60 * 60 * 24);
    }
    return newBookingsIndex;
};
exports.bookingResolvers = {
    Mutation: {
        createBooking: (_root, { input }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id, source, checkIn, checkOut } = input;
                const viewer = yield (0, utils_1.authorize)(db, req);
                if (!viewer) {
                    throw new Error('Viewer cannot be found');
                }
                const listing = yield db.listings.findOne({ _id: new mongodb_1.ObjectId(id) });
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
                const bookingsIndex = resolveBookingsIndex(listing.bookingsIndex, checkIn, checkOut);
                const totalPrice = (listing.price * (checkOutDate.getTime() - checkInDate.getTime())) /
                    1000 /
                    60 /
                    60 /
                    24;
                const host = yield db.users.findOne({ _id: listing.host });
                if (!host || !host.walletId) {
                    throw new Error('The host cannot be found or is not connected with Stripe');
                }
                yield api_1.Stripe.charge(totalPrice, source, host.walletId);
                const toInsert = {
                    _id: new mongodb_1.ObjectId(),
                    listing: listing._id,
                    tenant: viewer._id,
                    checkIn,
                    checkOut,
                };
                const insertResult = yield db.bookings.findOneAndUpdate({ _id: new mongodb_1.ObjectId() }, { $setOnInsert: toInsert }, { upsert: true, returnDocument: 'after' });
                const insertedBooking = insertResult.value;
                if (!insertedBooking) {
                    throw new Error('Failed to create booking');
                }
                yield db.users.updateOne({
                    _id: host._id,
                }, {
                    $inc: { income: totalPrice },
                });
                yield db.users.updateOne({
                    _id: viewer._id,
                }, {
                    $push: { bookings: insertedBooking._id },
                });
                yield db.listings.updateOne({
                    _id: listing._id,
                }, {
                    $set: { bookingsIndex },
                    $push: { bookings: insertedBooking === null || insertedBooking === void 0 ? void 0 : insertedBooking._id },
                });
                return insertedBooking;
            }
            catch (error) {
                throw new Error(`Failed to create booking: ${error}`);
            }
        }),
    },
    Booking: {
        id: (booking) => booking._id.toString(),
        listing: (booking, _args, { db }) => db.listings.findOne({ _id: booking.listing }),
        tenant: (booking, _args, { db }) => db.users.findOne({ _id: booking.tenant }),
    },
};

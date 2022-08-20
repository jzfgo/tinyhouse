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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewerResolvers = void 0;
const crypto_1 = __importDefault(require("crypto"));
const api_1 = require("../../../lib/api");
const utils_1 = require("../../../lib/utils");
const cookieOptions = {
    httpOnly: true,
    sameSite: true,
    signed: true,
    secure: process.env.NODE_ENV === 'development' ? false : true,
};
const logInViaGoogle = (code, token, db, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    const { user } = yield api_1.Google.logIn(code);
    if (!user) {
        throw new Error('Google login error');
    }
    // Name/Photo/Email Lists
    const userName = (_c = (_b = (_a = user === null || user === void 0 ? void 0 : user.names) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.displayName) !== null && _c !== void 0 ? _c : null;
    const userId = (_h = (_g = (_f = (_e = (_d = user === null || user === void 0 ? void 0 : user.names) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.metadata) === null || _f === void 0 ? void 0 : _f.source) === null || _g === void 0 ? void 0 : _g.id) !== null && _h !== void 0 ? _h : null;
    const userAvatar = (_l = (_k = (_j = user === null || user === void 0 ? void 0 : user.photos) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.url) !== null && _l !== void 0 ? _l : null;
    const userEmail = (_p = (_o = (_m = user === null || user === void 0 ? void 0 : user.emailAddresses) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.value) !== null && _p !== void 0 ? _p : null;
    if (!userId || !userName || !userAvatar || !userEmail) {
        throw new Error('Google login error');
    }
    const updateRes = yield db.users.findOneAndUpdate({ _id: userId }, {
        $set: {
            name: userName,
            avatar: userAvatar,
            contact: userEmail,
            token,
        },
    }, { returnDocument: 'after' });
    let viewer = updateRes.value;
    if (!viewer) {
        const insertResult = yield db.users.insertOne({
            _id: userId,
            token,
            name: userName,
            avatar: userAvatar,
            contact: userEmail,
            income: 0,
            bookings: [],
            listings: [],
        });
        viewer = yield db.users.findOne({ _id: insertResult.insertedId });
    }
    res.cookie('viewer', userId, Object.assign(Object.assign({}, cookieOptions), { maxAge: 365 * 24 * 60 * 60 * 1000 }));
    return viewer !== null && viewer !== void 0 ? viewer : undefined;
});
const logInViaCookie = (token, db, req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updateRes = yield db.users.findOneAndUpdate({ _id: req.signedCookies.viewer }, { $set: { token } }, { returnDocument: 'after' });
    const viewer = updateRes.value;
    if (!viewer) {
        res.clearCookie('viewer', cookieOptions);
    }
    return viewer !== null && viewer !== void 0 ? viewer : undefined;
});
exports.viewerResolvers = {
    Query: {
        authUrl: () => {
            try {
                return api_1.Google.authUrl;
            }
            catch (err) {
                throw new Error(`Failed to query Google Auth Url: ${err}`);
            }
        },
    },
    Mutation: {
        logIn: (_root, { input }, { db, req, res }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const code = input ? input.code : null;
                const token = crypto_1.default.randomBytes(16).toString('hex');
                const viewer = code
                    ? yield logInViaGoogle(code, token, db, res)
                    : yield logInViaCookie(token, db, req, res);
                if (!viewer) {
                    return { didRequest: true };
                }
                return {
                    _id: viewer._id,
                    token: viewer.token,
                    avatar: viewer.avatar,
                    walletId: viewer.walletId,
                    didRequest: true,
                };
            }
            catch (err) {
                throw new Error(`Failed to log in: ${err}`);
            }
        }),
        logOut: (_root, _args, { res }) => {
            try {
                res.clearCookie('viewer', cookieOptions);
                return { didRequest: true };
            }
            catch (err) {
                throw new Error(`Failed to log out: ${err}`);
            }
        },
        connectStripe: (_root, { input }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { code } = input;
                let viewer = yield (0, utils_1.authorize)(db, req);
                if (!viewer) {
                    throw new Error('Viewer cannot be found');
                }
                const wallet = yield api_1.Stripe.connect(code);
                if (!wallet) {
                    throw new Error('Stripe connection error');
                }
                const updateRes = yield db.users.findOneAndUpdate({ _id: viewer._id }, { $set: { walletId: wallet.stripe_user_id } }, { returnDocument: 'after' });
                if (!updateRes.value) {
                    throw new Error('Viewer cannot be found');
                }
                viewer = updateRes.value;
                return {
                    _id: viewer._id,
                    token: viewer.token,
                    avatar: viewer.avatar,
                    walletId: viewer.walletId,
                    didRequest: true,
                };
            }
            catch (err) {
                throw new Error(`Failed to connect to Stripe: ${err}`);
            }
        }),
        disconnectStripe: (_root, _args, { db, req }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                let viewer = yield (0, utils_1.authorize)(db, req);
                if (!viewer) {
                    throw new Error('Viewer cannot be found');
                }
                const updateRes = yield db.users.findOneAndUpdate({ _id: viewer._id }, { $set: { walletId: undefined } }, { returnDocument: 'after' });
                if (!updateRes.value) {
                    throw new Error('Viewer cannot be updated');
                }
                viewer = updateRes.value;
                return {
                    _id: viewer._id,
                    token: viewer.token,
                    avatar: viewer.avatar,
                    walletId: viewer.walletId,
                    didRequest: true,
                };
            }
            catch (err) {
                throw new Error(`Failed to disconnect from Stripe: ${err}`);
            }
        }),
    },
    Viewer: {
        id: (viewer) => {
            return viewer._id;
        },
        hasWallet: (viewer) => {
            return viewer.walletId ? true : undefined;
        },
    },
};

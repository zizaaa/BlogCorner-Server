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
const passport_jwt_1 = require("passport-jwt");
const passport_1 = __importDefault(require("passport"));
const db_config_1 = __importDefault(require("./db.config"));
require('dotenv').config();
const options = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};
passport_1.default.use(new passport_jwt_1.Strategy(options, (jwt_payload, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = yield db_config_1.default.query(query, [jwt_payload.id]);
        const filteredResult = {
            id: result.rows[0].id,
            username: result.rows[0].username,
            name: result.rows[0].name,
            email: result.rows[0].email,
            avatar: result.rows[0].avatar
        };
        if (result.rows.length > 0) {
            console.log(jwt_payload);
            return done(null, filteredResult);
        }
        else {
            console.log('Unauthorized');
            return done(null, false);
        }
    }
    catch (error) {
        console.log('Unauthorized');
        return done(error, false);
    }
})));
exports.default = passport_1.default;

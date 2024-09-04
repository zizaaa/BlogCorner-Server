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
exports.insertToken = insertToken;
exports.getToken = getToken;
exports.deleteToken = deleteToken;
const db_config_1 = __importDefault(require("../config/db.config"));
function insertToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const insertTokenQuery = `
        INSERT INTO tokens
        (access_token)
        VALUES ($1)
        RETURNING *;
    `;
        try {
            yield db_config_1.default.query(insertTokenQuery, [token]);
            console.log('Success storing token.');
            return 'success';
        }
        catch (error) {
            console.error(error);
            return 'Error storing token.';
        }
    });
}
function getToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const getTokenQuery = `
        SELECT access_token
        FROM tokens
        WHERE access_token = $1
    `;
        try {
            const result = yield db_config_1.default.query(getTokenQuery, [token]);
            if (result.rows.length === 0) {
                return 'Token not found';
            }
            return result;
        }
        catch (error) {
            console.error('Error retrieving token:', error);
            return 'Error retrieving token';
        }
    });
}
function deleteToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const deleteTokenQuery = `
        DELETE FROM tokens
        WHERE access_token = $1
    `;
        try {
            yield db_config_1.default.query(deleteTokenQuery, [token]);
            console.log('Success deleting token.');
            return 'success';
        }
        catch (error) {
            console.error(error);
            return 'Error deleting token';
        }
    });
}

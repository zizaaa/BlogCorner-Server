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
exports.tokenTable = tokenTable;
const db_config_1 = __importDefault(require("../config/db.config"));
function tokenTable() {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenQeury = `
    CREATE TABLE IF NOT EXISTS tokens (
    access_token VARCHAR(200) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
        try {
            yield db_config_1.default.query(tokenQeury);
            console.log('Token table created');
        }
        catch (error) {
            console.error(error);
        }
    });
}

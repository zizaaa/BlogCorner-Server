"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookmark_1 = require("../controller/bookmark");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
router.post('/save', passport_1.default.authenticate('jwt', { session: false }), bookmark_1.addBookMark);
router.get('/saved', passport_1.default.authenticate('jwt', { session: false }), bookmark_1.isSavedBlog);
router.get('/get/bookmarked', passport_1.default.authenticate('jwt', { session: false }), bookmark_1.getBookMarked);
exports.default = router;

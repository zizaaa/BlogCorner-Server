"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCount = void 0;
const formatCount = (count) => {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    }
    else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
};
exports.formatCount = formatCount;

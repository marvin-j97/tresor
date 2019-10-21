"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LIFOStrategy {
    choose(items, options) {
        return items.length - 1;
    }
}
exports.LIFOStrategy = LIFOStrategy;

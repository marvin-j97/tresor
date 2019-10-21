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
const base_1 = require("./base");
class MemoryAdapter extends base_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.internalStore = {};
    }
    store(key, value, options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.internalStore[key] = value;
        });
    }
    retrieve(key, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = this.internalStore[key];
            return value ? value : null;
        });
    }
    remove(key, options) {
        return __awaiter(this, void 0, void 0, function* () {
            delete this.internalStore[key];
        });
    }
    clearSelf() {
        return __awaiter(this, void 0, void 0, function* () {
            this.internalStore = {};
        });
    }
}
exports.MemoryAdapter = MemoryAdapter;

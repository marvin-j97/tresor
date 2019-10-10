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
const base_1 = require("./base");
const md5_1 = __importDefault(require("md5"));
class MemoryAdapter extends base_1.BaseAdapter {
    constructor() {
        super(...arguments);
        this.internalStore = {};
    }
    store(context, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.internalStore[md5_1.default(context.path + context.auth)] = value;
        });
    }
    retrieve(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = this.internalStore[md5_1.default(context.path + context.auth)];
            return value ? value : null;
        });
    }
    remove(context) {
        return __awaiter(this, void 0, void 0, function* () {
            delete this.internalStore[md5_1.default(context.path + context.auth)];
        });
    }
    clearSelf() {
        return __awaiter(this, void 0, void 0, function* () {
            this.internalStore = {};
        });
    }
}
exports.MemoryAdapter = MemoryAdapter;

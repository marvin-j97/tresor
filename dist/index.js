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
const time_extractor_1 = require("./time_extractor");
const memory_1 = require("./adapters/memory");
exports.MemoryAdapter = memory_1.MemoryAdapter;
const file_1 = require("./adapters/file");
exports.FileAdapter = file_1.FileAdapter;
const base_1 = require("./adapters/base");
exports.BaseAdapter = base_1.BaseAdapter;
const fifo_1 = require("./discard_strategies/fifo");
exports.FIFOStrategy = fifo_1.FIFOStrategy;
const lifo_1 = require("./discard_strategies/lifo");
exports.LIFOStrategy = lifo_1.LIFOStrategy;
class Tresor {
    constructor(options) {
        this.options = {
            maxSize: 100,
            maxAge: time_extractor_1.parseDuration("5 min"),
            adapter: new memory_1.MemoryAdapter(),
            discardStrategy: new fifo_1.FIFOStrategy()
        };
        if (options)
            Object.assign(this.options, options);
        this.options.maxAge = time_extractor_1.parseDuration(this.options.maxAge);
        if (this.options.maxSize < 1) {
            throw "TRESOR: maxAmount needs to be 1 or higher";
        }
        if (this.options.maxAge < 1) {
            throw "TRESOR: maxAge needs to be 1 or higher";
        }
    }
    checkCache(path, auth) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter().checkCache({
                path,
                auth,
                options: this.options
            });
        });
    }
    addToCache(path, auth, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter().addToCache({
                path,
                auth,
                options: this.options
            }, value);
        });
    }
    getOpts() {
        return this.options;
    }
    getOptions() {
        return this.options;
    }
    adapter() {
        return this.options.adapter;
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter().clear();
        });
    }
    invalidate(path, auth) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter().clearItem({
                path,
                auth,
                options: this.options
            });
        });
    }
}
exports.Tresor = Tresor;

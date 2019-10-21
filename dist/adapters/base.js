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
const sha1_1 = __importDefault(require("sha1"));
const time_extractor_1 = require("../time_extractor");
class BaseAdapter {
    constructor() {
        this.items = {};
        this.hashes = [];
        this.numItems = 0;
        this.timers = {};
    }
    removeTimer(key) {
        const timer = this.timers[key];
        if (timer)
            clearTimeout(timer);
        delete this.timers[key];
    }
    getTimers() {
        return Object.keys(this.timers).map(hash => this.timers[hash]);
    }
    size() {
        return this.numItems;
    }
    getItem(key) {
        return this.items[key];
    }
    storeItem(key, value, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.store(key, value, options);
            this.items[key] = {
                storedOn: +new Date()
            };
            this.timers[key] = setTimeout(() => {
                this.removeItem(key, options);
            }, typeof options.maxAge == "string"
                ? time_extractor_1.parseDuration(options.maxAge)
                : options.maxAge);
            this.numItems++;
            this.hashes.push(key);
        });
    }
    removeItem(key, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.remove(key, options);
            delete this.items[key];
            this.hashes = this.hashes.filter(hash => hash != key);
            this.removeTimer(key);
            this.numItems--;
        });
    }
    checkCache({ path, auth, options }) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = sha1_1.default(path + auth);
            const item = this.getItem(hash);
            if (item) {
                if (item.storedOn < new Date().valueOf() - options.maxAge) {
                    this.removeItem(hash, options);
                    return null;
                }
                else {
                    const cached = yield this.retrieve(hash, options);
                    return cached;
                }
            }
            else {
                return null;
            }
        });
    }
    removeIndex(index, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = this.hashes[index];
            if (hash) {
                yield this.removeItem(hash, options);
            }
        });
    }
    addToCache({ path, auth, options }, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = sha1_1.default(path + auth);
            const item = this.getItem(hash);
            if (!item) {
                if (this.size() == options.maxSize) {
                    yield this.removeIndex(options.discardStrategy.choose(this.hashes.map(hash => this.items[hash]), options), options);
                    if (options.onCacheFull)
                        options.onCacheFull();
                }
                yield this.storeItem(hash, value, options);
                if (options.onStore)
                    options.onStore(path, this.numItems);
            }
        });
    }
    clearItem({ path, auth, options }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.removeItem(sha1_1.default(path + auth), options);
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.clearSelf();
            this.getTimers().forEach(timer => clearTimeout(timer));
            this.timers = {};
            this.items = {};
            this.hashes = [];
            this.numItems = 0;
        });
    }
}
exports.BaseAdapter = BaseAdapter;

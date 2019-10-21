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
        this.items = [];
        this.timers = {};
    }
    removeTimer(key) {
        const timer = this.getTimer(key);
        if (timer)
            clearTimeout(timer);
        delete this.timers[key];
    }
    getTimer(key) {
        return this.timers[key];
    }
    getTimers() {
        return Object.keys(this.timers).map(this.getTimer);
    }
    size() {
        return this.items.length;
    }
    getItem({ path, auth }) {
        return this.items.find(item => item.path == path && item.auth == auth);
    }
    storeItem(context, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.store(context, value);
            this.items.push({
                path: context.path,
                auth: context.auth,
                storedOn: +new Date()
            });
            const hash = sha1_1.default(context.path + context.auth);
            this.timers[hash] = setTimeout(() => {
                this.removeItem(context);
            }, typeof context.options.maxAge == "string"
                ? time_extractor_1.parseDuration(context.options.maxAge)
                : context.options.maxAge);
            if (context.options.onStore)
                context.options.onStore(context.path, this.items.length);
        });
    }
    removeItem(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.remove(context);
            this.items = this.items.filter(item => !(item.path == context.path && item.auth == context.auth));
            const hash = sha1_1.default(context.path + context.auth);
            this.removeTimer(hash);
        });
    }
    checkCache({ path, auth, options }) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = this.getItem({ path, auth, options });
            if (item) {
                if (item.storedOn < new Date().valueOf() - options.maxAge) {
                    this.removeItem({ path, auth, options });
                    return null;
                }
                else {
                    const cached = yield this.retrieve({ path, auth, options });
                    return cached;
                }
            }
            else {
                return null;
            }
        });
    }
    removeOldest(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldest = this.items.shift();
            yield this.removeItem({ path: oldest.path, auth: oldest.auth, options });
        });
    }
    addToCache({ path, auth, options }, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = this.getItem({ path, auth, options });
            if (!item) {
                if (this.size() == options.maxSize) {
                    yield this.removeOldest(options);
                    if (options.onCacheFull)
                        options.onCacheFull();
                }
                yield this.storeItem({ path, auth, options }, value);
            }
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.clearSelf();
            this.getTimers().forEach(timer => clearTimeout(timer));
            this.timers = {};
            this.items = [];
        });
    }
}
exports.BaseAdapter = BaseAdapter;

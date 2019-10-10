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
class BaseAdapter {
    constructor() {
        this.items = [];
    }
    size() {
        return this.items.length;
    }
    getItem({ path, auth, options }) {
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
            if (context.options.onStore)
                context.options.onStore(context.path, this.items.length);
        });
    }
    removeItem(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.remove(context);
            this.items = this.items.filter(item => !(item.path == context.path && item.auth == context.auth));
        });
    }
    checkCache({ path, auth, options }) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = this.getItem({ path, auth, options });
            if (item) {
                if (item.storedOn < new Date().valueOf() - options.maxAge &&
                    this.size() > options.minSize) {
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
            this.items = [];
        });
    }
}
exports.BaseAdapter = BaseAdapter;

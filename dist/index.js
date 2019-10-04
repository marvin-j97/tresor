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
class BaseResolver {
    constructor() {
        this.items = [];
    }
    amount() {
        return this.items.length;
    }
    getItem(path, auth, options) {
        return this.items.find(item => item.path == path && item.auth == auth);
    }
    storeItem(context, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.store(context, value);
            this.items.push({
                path: context.path,
                auth: context.auth,
                storedOn: +new Date
            });
        });
    }
    removeItem(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.remove(context);
            const index = this.items.findIndex(item => item.path == context.path && item.auth == context.auth);
            if (index > -1)
                this.items.splice(index, 1);
        });
    }
    checkCache(req, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const auth = options.auth(req);
            const item = this.getItem(req.originalUrl, auth, options);
            if (item) {
                if (item.storedOn < (new Date().valueOf() - options.maxAge)) {
                    this.removeItem({ path: req.originalUrl, auth, options });
                    return null;
                }
                else {
                    const cached = yield this.retrieve({ path: req.originalUrl, auth, options });
                    return cached;
                }
            }
            else {
                return null;
            }
        });
    }
    tryCache(value, req, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const auth = options.auth(req);
            const item = this.getItem(req.originalUrl, auth, options);
            if (!item) {
                if (this.amount() == options.maxAmount) {
                    const oldest = this.items.shift();
                    yield this.removeItem({ path: oldest.path, auth: oldest.auth, options });
                }
                yield this.storeItem({ path: req.originalUrl, auth, options }, value);
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
exports.BaseResolver = BaseResolver;
class Tresor {
    constructor(options) {
        const _default = {
            maxAmount: 100,
            maxAge: 60000,
            auth: () => null,
            manualResponse: false,
            resType: "json",
            shouldCache: (req, res) => true,
            resolver: new memory_1.MemoryResolver()
        };
        Object.assign(_default, options);
        this.options = _default;
        if (this.options.maxAmount < 1) {
            throw "TRESOR: maxAmount needs to be 1 or higher";
        }
        if (this.options.maxAge < 1) {
            throw "TRESOR: maxAge needs to be 1 or higher";
        }
    }
    sendCached(res, value) {
        if (this.options.resType === "json")
            res.json(JSON.parse(value));
        else if (this.options.resType === "html")
            res.send(value);
    }
    init() {
        return this.middleware();
    }
    middleware() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const beforeCache = +new Date();
            const cached = yield this.options.resolver.checkCache(req, this.options);
            if (cached != null) {
                if (this.options.onCacheHit)
                    this.options.onCacheHit(req.originalUrl, new Date().valueOf() - beforeCache);
                if (this.options.manualResponse === false) {
                    return this.sendCached(res, cached);
                }
                req.$tresor = {
                    isCached: true,
                    value: cached
                };
            }
            else {
                if (this.options.onCacheMiss)
                    this.options.onCacheMiss(req.originalUrl, new Date().valueOf() - beforeCache);
            }
            res.$tresor = (value) => __awaiter(this, void 0, void 0, function* () {
                let _value = value;
                if (typeof value == "object")
                    _value = JSON.stringify(value);
                if (this.options.shouldCache(req, res))
                    yield this.options.resolver.tryCache(_value, req, this.options);
                this.sendCached(res, _value);
            });
            next();
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.options.resolver.clear();
        });
    }
}
exports.Tresor = Tresor;
const memory_1 = require("./resolvers/memory");
exports.MemoryResolver = memory_1.MemoryResolver;
const file_1 = require("./resolvers/file");
exports.FileResolver = file_1.FileResolver;

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
        const _default = {
            maxSize: 100,
            maxAge: time_extractor_1.parseDuration("5 min"),
            auth: () => null,
            manualResponse: false,
            responseType: "json",
            shouldCache: () => true,
            adapter: new memory_1.MemoryAdapter(),
            discardStrategy: new fifo_1.FIFOStrategy()
        };
        if (options)
            Object.assign(_default, options);
        this.options = _default;
        this.options.maxAge = time_extractor_1.parseDuration(this.options.maxAge);
        if (this.options.maxSize < 1) {
            throw "TRESOR: maxAmount needs to be 1 or higher";
        }
        if (this.options.maxAge < 1) {
            throw "TRESOR: maxAge needs to be 1 or higher";
        }
    }
    adapter() {
        return this.options.adapter;
    }
    static html(options) {
        let _options = Object.assign(Object.assign({}, options), { responseType: "html" });
        return new Tresor(_options);
    }
    static json(options) {
        let _options = Object.assign(Object.assign({}, options), { responseType: "json" });
        return new Tresor(_options);
    }
    sendCached(res, value) {
        if (this.options.responseType === "json")
            res.json(JSON.parse(value));
        else if (this.options.responseType === "html")
            res.send(value);
    }
    init() {
        return this.middleware();
    }
    middleware() {
        return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const beforeCache = +new Date();
            const auth = this.options.auth(req, res);
            const cached = yield this.adapter().checkCache({
                path: req.originalUrl,
                auth,
                options: this.options
            });
            if (cached != null) {
                if (this.options.onCacheHit)
                    this.options.onCacheHit(req.originalUrl, new Date().valueOf() - beforeCache);
                if (this.options.manualResponse === false) {
                    return this.sendCached(res, cached);
                }
                req.$tresor = {
                    isCached: true,
                    value: cached,
                    instance: this
                };
            }
            else {
                if (this.options.onCacheMiss)
                    this.options.onCacheMiss(req.originalUrl, new Date().valueOf() - beforeCache);
            }
            res.$tresor = {
                send: (value) => __awaiter(this, void 0, void 0, function* () {
                    const _value = yield res.$tresor.cache(value);
                    this.sendCached(res, _value);
                    return _value;
                }),
                cache: (value) => __awaiter(this, void 0, void 0, function* () {
                    let _value = value;
                    if (typeof value == "object")
                        _value = JSON.stringify(value);
                    if (this.options.shouldCache(req, res))
                        yield this.adapter().addToCache({ path: req.originalUrl, auth, options: this.options }, _value);
                    return _value;
                })
            };
            next();
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.adapter().clear();
        });
    }
    invalidate(path, auth) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.adapter().clearItem({
                path,
                auth,
                options: this.options
            });
        });
    }
}
exports.Tresor = Tresor;

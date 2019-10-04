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
const index_1 = require("../index");
class MemoryResolver extends index_1.BaseResolver {
    constructor() {
        super(...arguments);
        this.internalStore = [];
    }
    store(context, value) {
        return __awaiter(this, void 0, void 0, function* () {
            this.internalStore.push({
                path: context.path,
                auth: context.auth,
                value
            });
        });
    }
    retrieve(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = this.internalStore.find(item => item.path == context.path && item.auth == context.auth);
            return item ? item.value : null;
        });
    }
    remove(context) {
        return __awaiter(this, void 0, void 0, function* () {
            this.internalStore = this.internalStore.filter(item => !(item.path == context.path && item.auth == context.auth));
        });
    }
    clearSelf() {
        return __awaiter(this, void 0, void 0, function* () {
            this.internalStore = [];
        });
    }
}
exports.MemoryResolver = MemoryResolver;

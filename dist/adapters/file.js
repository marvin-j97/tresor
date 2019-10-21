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
const sha1_1 = __importDefault(require("sha1"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const fs_1 = require("fs");
const promiseExist = util_1.promisify(fs_1.exists);
const promiseRead = util_1.promisify(fs_1.readFile);
const promiseWrite = util_1.promisify(fs_1.writeFile);
const promiseUnlink = util_1.promisify(fs_1.unlink);
const promiseMkdir = util_1.promisify(fs_1.mkdir);
class FileAdapter extends base_1.BaseAdapter {
    constructor(basePath) {
        super();
        this.files = [];
        this.basePath = basePath || "./tresor_cache";
        const folder = path_1.default.join(process.cwd(), this.basePath);
        promiseMkdir(path_1.default.relative(process.cwd(), folder), { recursive: true });
    }
    filePath(path, auth, ext) {
        const hash = sha1_1.default(path + auth);
        const folder = path_1.default.join(process.cwd(), this.basePath);
        const filePath = path_1.default.join(folder, hash + "." + ext);
        return filePath;
    }
    getFile(path, auth, ext) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filePath = this.filePath(path, auth, ext);
                if (yield promiseExist(filePath))
                    return yield promiseRead(filePath, "utf-8");
                return null;
            }
            catch (err) {
                throw err;
            }
        });
    }
    store(context, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filePath = this.filePath(context.path, context.auth, context.options.responseType);
                yield promiseWrite(filePath, value);
                this.files.push(filePath);
            }
            catch (err) {
                throw err;
            }
        });
    }
    retrieve(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield this.getFile(context.path, context.auth, context.options.responseType);
            return content;
        });
    }
    remove(context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filePath = this.filePath(context.path, context.auth, context.options.responseType);
                if (yield promiseExist(filePath)) {
                    yield promiseUnlink(filePath);
                    this.files = this.files.filter(item => item != filePath);
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    clearSelf() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const file of this.files) {
                try {
                    yield promiseUnlink(file);
                }
                catch (err) { }
            }
            this.files = [];
        });
    }
}
exports.FileAdapter = FileAdapter;

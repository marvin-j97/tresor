import express from "express";
interface ITresorInject {
    isCached: boolean;
    value: string;
}
export interface IResolverContext {
    path: string;
    auth: string | null;
    options: ITresorOptions;
}
declare global {
    namespace Express {
        interface Request {
            $tresor?: ITresorInject;
        }
        interface Response {
            $tresor: (value: object | string) => void;
        }
    }
}
declare type AuthFunction = (req: express.Request) => string | null;
declare type CacheItem = {
    path: string;
    auth: string | null;
    storedOn: number;
};
export interface ITresorOptions {
    maxAmount: number;
    maxAge: number;
    resolver: BaseResolver;
    auth: AuthFunction;
    manualResponse: boolean;
    resType: "json" | "html";
    shouldCache: (req: express.Request, res: express.Response) => boolean;
    onCacheHit?: (path: string, time: number) => void;
    onCacheMiss?: (path: string, time: number) => void;
}
export declare abstract class BaseResolver {
    protected items: CacheItem[];
    private amount;
    private getItem;
    private storeItem;
    private removeItem;
    checkCache(req: express.Request, options: ITresorOptions): Promise<string | null>;
    tryCache(value: string, req: express.Request, options: ITresorOptions): Promise<void>;
    clear(): Promise<void>;
    protected abstract store(context: IResolverContext, value: string): Promise<void>;
    protected abstract retrieve(context: IResolverContext): Promise<string | null>;
    protected abstract remove(context: IResolverContext): Promise<void>;
    protected abstract clearSelf(): Promise<void>;
}
export declare class Tresor {
    options: ITresorOptions;
    constructor(options?: Partial<ITresorOptions>);
    private sendCached;
    init(): (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
    middleware(): (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
    clear(): Promise<void>;
}
import { MemoryResolver } from "./resolvers/memory";
export { MemoryResolver };
import { FileResolver } from "./resolvers/file";
export { FileResolver };

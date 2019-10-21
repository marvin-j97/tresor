import express from "express";
import { Tresor } from "./index";
import { BaseAdapter } from "./adapters/base";
export interface HashMap<T> {
    [key: string]: T;
}
export interface ITresorInject {
    isCached: boolean;
    value: string;
    instance: Tresor;
}
export interface IAdapterContext {
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
            $tresor: {
                cache: (value: object | string) => Promise<string>;
                send: (value: object | string) => Promise<string>;
            };
        }
    }
}
export declare type AuthFunction = (req: express.Request, res: express.Response) => string | null;
export declare type CacheItem = {
    path: string;
    auth: string | null;
    storedOn: number;
};
export interface ITresorOptions {
    maxSize: number;
    maxAge: number | string;
    adapter: BaseAdapter;
    auth: AuthFunction;
    manualResponse: boolean;
    responseType: "json" | "html";
    shouldCache: (req: express.Request, res: express.Response) => boolean;
    onStore?: (path: string, amount: number) => void;
    onCacheHit?: (path: string, time: number) => void;
    onCacheMiss?: (path: string, time: number) => void;
    onCacheFull?: () => void;
}

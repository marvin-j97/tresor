import express from "express";
import { ITresorOptions } from "./types";
import { MemoryAdapter } from "./adapters/memory";
import { FileAdapter } from "./adapters/file";
import { BaseAdapter } from "./adapters/base";
import { IDiscardStrategy } from "./discard_strategies/index";
import { FIFOStrategy } from "./discard_strategies/fifo";
import { LIFOStrategy } from "./discard_strategies/lifo";
export declare class Tresor {
    options: ITresorOptions;
    adapter(): BaseAdapter;
    static html(options?: Partial<Omit<ITresorOptions, "responseType">>): Tresor;
    static json(options?: Partial<Omit<ITresorOptions, "responseType">>): Tresor;
    constructor(options?: Partial<ITresorOptions>);
    private sendCached;
    init(): (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
    middleware(): (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
    clear(): Promise<void>;
    invalidate(path: string, auth: string | null): Promise<void>;
}
export { MemoryAdapter };
export { FileAdapter };
export { BaseAdapter };
export { IDiscardStrategy };
export { FIFOStrategy };
export { LIFOStrategy };
export * from "./types";

import express from "express";
import { ITresorOptions } from "./types";
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
import { MemoryAdapter } from "./adapters/memory";
export { MemoryAdapter };
import { FileAdapter } from "./adapters/file";
export { FileAdapter };
import { BaseAdapter } from "./adapters/base";
export { BaseAdapter };
export * from "./types";

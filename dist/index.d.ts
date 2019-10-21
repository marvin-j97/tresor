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
    constructor(options?: Partial<ITresorOptions>);
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

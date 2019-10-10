import { BaseAdapter } from "./base";
import { IAdapterContext } from "../types";
export declare class MemoryAdapter extends BaseAdapter {
    private internalStore;
    store(context: IAdapterContext, value: string): Promise<void>;
    retrieve(context: IAdapterContext): Promise<string | null>;
    remove(context: IAdapterContext): Promise<void>;
    clearSelf(): Promise<void>;
}

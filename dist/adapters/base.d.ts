import { CacheItem, IAdapterContext, ITresorOptions, HashMap } from "../types";
export declare abstract class BaseAdapter {
    protected items: HashMap<CacheItem>;
    protected hashes: string[];
    private numItems;
    private timers;
    private removeTimer;
    private getTimers;
    size(): number;
    private getItem;
    private storeItem;
    removeItem(key: string, options: ITresorOptions): Promise<void>;
    checkCache({ path, auth, options }: IAdapterContext): Promise<string | null>;
    private removeIndex;
    addToCache({ path, auth, options }: IAdapterContext, value: string): Promise<void>;
    clearItem({ path, auth, options }: IAdapterContext): Promise<void>;
    clear(): Promise<void>;
    protected abstract store(key: string, value: string, options: ITresorOptions): Promise<void>;
    protected abstract retrieve(key: string, options: ITresorOptions): Promise<string | null>;
    protected abstract remove(key: string, options: ITresorOptions): Promise<void>;
    protected abstract clearSelf(): Promise<void>;
}

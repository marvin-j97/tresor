import { CacheItem, IAdapterContext } from "../types";
export declare abstract class BaseAdapter {
    protected items: CacheItem[];
    size(): number;
    private getItem;
    private storeItem;
    removeItem(context: IAdapterContext): Promise<void>;
    checkCache({ path, auth, options }: IAdapterContext): Promise<string | null>;
    private removeOldest;
    addToCache({ path, auth, options }: IAdapterContext, value: string): Promise<void>;
    clear(): Promise<void>;
    protected abstract store(context: IAdapterContext, value: string): Promise<void>;
    protected abstract retrieve(context: IAdapterContext): Promise<string | null>;
    protected abstract remove(context: IAdapterContext): Promise<void>;
    protected abstract clearSelf(): Promise<void>;
}

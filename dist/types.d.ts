import { BaseAdapter } from "./adapters/base";
import { IDiscardStrategy } from "./discard_strategies/index";
export interface HashMap<T> {
    [key: string]: T;
}
export interface IAdapterContext {
    path: string;
    auth: string | null;
    options: ITresorOptions;
}
export declare type CacheItem = {
    storedOn: number;
};
export interface ITresorOptions {
    discardStrategy: IDiscardStrategy;
    maxSize: number;
    maxAge: number | string;
    adapter: BaseAdapter;
    onStore?: (path: string, amount: number) => void;
    onCacheHit?: (path: string, time: number) => void;
    onCacheMiss?: (path: string, time: number) => void;
    onCacheFull?: () => void;
}

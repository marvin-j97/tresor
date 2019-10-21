import { ITresorOptions, CacheItem } from "../types";
export interface IDiscardStrategy {
    choose(items: CacheItem[], options: ITresorOptions): number;
}

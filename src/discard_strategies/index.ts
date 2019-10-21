import { ITresorOptions, CacheItem } from "../types";

export interface IDiscardStrategy {
  // Return index of item to remove
  // Index 0 = oldest item, etc.
  choose(items: CacheItem[], options: ITresorOptions): number;
}

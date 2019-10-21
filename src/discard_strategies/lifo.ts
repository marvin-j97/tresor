import { ITresorOptions, CacheItem } from "../types";
import { IDiscardStrategy } from "./index";

export class LIFOStrategy implements IDiscardStrategy {
  choose(items: CacheItem[], options: ITresorOptions): number {
    return items.length - 1;
  }
}

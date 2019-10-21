import { ITresorOptions, CacheItem } from "../types";
import { IDiscardStrategy } from "./index";

export class FIFOStrategy implements IDiscardStrategy {
  choose(items: CacheItem[], options: ITresorOptions): number {
    return 0;
  }
}

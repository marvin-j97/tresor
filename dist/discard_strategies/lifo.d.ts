import { ITresorOptions, CacheItem } from "../types";
import { IDiscardStrategy } from "./index";
export declare class LIFOStrategy implements IDiscardStrategy {
    choose(items: CacheItem[], options: ITresorOptions): number;
}

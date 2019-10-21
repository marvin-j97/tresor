import { ITresorOptions, CacheItem } from "../types";
import { IDiscardStrategy } from "./index";
export declare class FIFOStrategy implements IDiscardStrategy {
    choose(items: CacheItem[], options: ITresorOptions): number;
}

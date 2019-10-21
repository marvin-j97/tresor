import { BaseAdapter } from "./adapters/base";
import { IDiscardStrategy } from "./discard_strategies/index";

export interface HashMap<T> {
  [key: string]: T;
}

// Context given to the adapter operations
export interface IAdapterContext {
  path: string;
  auth: string | null;
  options: ITresorOptions;
}

// Stored cache item metadata
// Cached content location (like JSON or HTML) is adapter-specific
export type CacheItem = {
  storedOn: number;
};

// Constructor options
export interface ITresorOptions {
  // Discard strategy to use when adding an item to an already full cache (default = new FIFOStrategy())
  discardStrategy: IDiscardStrategy;
  // Only allow limited amount of items (default = 100)
  maxSize: number;
  // Max age in ms (default = 300000 aka. 5 minutes)
  maxAge: number | string;
  // Adapter to use (default = MemoryAdapter)
  adapter: BaseAdapter;
  // Cache store hook (default = undefined)
  onStore?: (path: string, amount: number) => void;
  // Cache Hit hook (default = undefined)
  onCacheHit?: (path: string, time: number) => void;
  // Cache Miss hook (default = undefined)
  onCacheMiss?: (path: string, time: number) => void;
  // Cache Full hook (default = undefined)
  onCacheFull?: () => void;
}

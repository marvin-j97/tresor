import express from "express";
import { Tresor } from "./index";
import { BaseResolver } from "./resolvers/base";

// Injected cached content in request
// (only relevant when using manualResponse)
export interface ITresorInject {
  isCached: boolean;
  value: string;
  instance: Tresor;
}

// Context given to the resolver operations
export interface IResolverContext {
  path: string;
  auth: string | null;
  options: ITresorOptions;
}

declare global {
  namespace Express {
    export interface Request {
      $tresor?: ITresorInject;
    }
    export interface Response {
      $tresor: {
        cache: (value: object | string) => Promise<string>;
        send: (value: object | string) => Promise<string>;
      };
    }
  }
}

// Returns a string (like a session token or user ID) that identifies some sort of authenticated entity
// Cached items are signed with that string
// Returns null for unauthenticated caches
export type AuthFunction = (
  req: express.Request,
  res: express.Response
) => string | null;

// Stored cache item metadata
// Cached content location (like JSON or HTML) is resolver-specific
export type CacheItem = { path: string; auth: string | null; storedOn: number };

// Constructor options
export interface ITresorOptions {
  // Discard strategy to use when adding an item to an already full cache
  // discardStrategy: "fifo"
  // Use timers to sweep expired cache items (default = true)
  // Minimizes the amount of stale items in the cache
  // useTimers: boolean
  // Ignore expired items, as long as minAmount is not reached (default = 0)
  // Increases cache hit chance, but will also increase memory usage and may lead to stale items if traffic is low
  // Not relevant when using timers
  minSize: number;
  // Only allow limited amount of items (default = 100)
  maxSize: number;
  // Max age in ms (default = 60000 aka. 1 minute)
  maxAge: number | string;
  // Resolver to use (default = MemoryResolver)
  resolver: BaseResolver;
  // Authentication cache items will be signed with (default = () => null), null = no authentication
  auth: AuthFunction;
  // If true, cached content is not automatically sent to client, but rather exposed in request (default = false)
  manualResponse: boolean;
  // Response type (default = "json")
  responseType: "json" | "html";
  // Whether content should be cached at all (default = () => true)
  shouldCache: (req: express.Request, res: express.Response) => boolean;
  // Cache store hook (default = undefined)
  onStore?: (path: string, amount: number) => void;
  // Cache Hit hook (default = undefined)
  onCacheHit?: (path: string, time: number) => void;
  // Cache Miss hook (default = undefined)
  onCacheMiss?: (path: string, time: number) => void;
  // Cache Full hook (default = undefined)
  onCacheFull?: () => void;
}

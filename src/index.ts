import express from "express"

// Injected cached content in request
// (only relevant when using manualResponse)
interface ITresorInject {
  isCached: boolean
  value: string
  instance: Tresor
}

// Context given to the resolver operations
export interface IResolverContext {
  path: string
  auth: string | null
  options: ITresorOptions
}

declare global {
  namespace Express {
    export interface Request {
      $tresor?: ITresorInject
    }
    export interface Response {
      $tresor: {
        cache: (value: object | string) => Promise<string>,
        send: (value: object | string) => Promise<string>
      }
    }
  }
}

// Returns a string (like a session token or user ID) that identifies some sort of authenticated entity
// Cached items are signed with that string
// Returns null for unauthenticated caches
type AuthFunction = (req: express.Request, res: express.Response) => string | null

// Stored cache item metadata
// Cached content location (like JSON or HTML) is resolver-specific
type CacheItem = { path: string, auth: string | null, storedOn: number }

// Constructor options
export interface ITresorOptions {
  // Ignore expired items, as long as minAmount is not reached (default = 0)
  minAmount: number
  // Only allow limited amount of items (default = 100)
  maxAmount: number
  // Max age in ms (default = 60000 aka. 1 minute)
  maxAge: number
  // Resolver to use (default = MemoryResolver)
  resolver: BaseResolver
  // Authentication cache items will be signed with (default = () => null), null = no authentication
  auth: AuthFunction
  // If true, cached content is not automatically sent to client, but rather exposed in request (default = false)
  manualResponse: boolean
  // Response type (default = "json")
  resType: "json" | "html"
  // Whether content should be cached at all (default = () => true)
  shouldCache: (req: express.Request, res: express.Response) => boolean
  // Cache Hit hook (default = undefined)
  onCacheHit?: (path: string, time: number) => void
  // Cache Miss hook (default = undefined)
  onCacheMiss?: (path: string, time: number) => void
  // Cache Full hook (default = undefined)
  onCacheFull?: () => void
}

// Base class to create new Resolvers
// Public methods should not be called by the deriving resolvers
export abstract class BaseResolver {
  protected items = [] as CacheItem[]

  private amount() {
    return this.items.length
  }

  private getItem(path: string, auth: string | null, options: ITresorOptions) {
    return this.items.find(item => item.path == path && item.auth == auth)
  }

  private async storeItem(context: IResolverContext, value: string) {
    await this.store(context, value)
    this.items.push({
      path: context.path,
      auth: context.auth,
      storedOn: +new Date
    })
  }

  private async removeItem(context: IResolverContext) {
    await this.remove(context)

    this.items = this.items.filter(item => !(item.path == context.path && item.auth == context.auth))
  }

  public async checkCache(path: string, auth: string | null, options: ITresorOptions): Promise<string | null> {
    const item = this.getItem(path, auth, options)

    if (item) {
      // Cache minAmount will ignore cache age if above 0
      if (item.storedOn < (new Date().valueOf() - options.maxAge) && this.amount() > options.minAmount) {
        // Cache miss: Cached item too old && minAmount reached
        this.removeItem({ path, auth, options })
        return null
      }
      else {
        // Cache hit
        const cached = await this.retrieve({ path, auth, options })
        return cached
      }
    }
    else {
      // Cache miss: No item
      return null
    }
  }

  public async tryCache(path: string, auth: string | null, value: string, options: ITresorOptions) {
    const item = this.getItem(path, auth, options)

    if (!item) {
      if (this.amount() == options.maxAmount) {
        // Cache full
        const oldest = (<CacheItem>this.items.shift())
        await this.removeItem({ path: oldest.path, auth: oldest.auth, options })
        if (options.onCacheFull)
          options.onCacheFull()
      }
      await this.storeItem({ path, auth, options }, value)
    }
  }

  public async clear() {
    await this.clearSelf()
    this.items = []
  }

  protected abstract store(context: IResolverContext, value: string): Promise<void>
  protected abstract retrieve(context: IResolverContext): Promise<string | null>
  protected abstract remove(context: IResolverContext): Promise<void>
  protected abstract clearSelf(): Promise<void>
}

// Tresor instance
// Use .init() or .middleware() when adding to an Express route
export class Tresor {
  options: ITresorOptions

  constructor(options?: Partial<ITresorOptions>) {
    const _default: ITresorOptions = {
      minAmount: 0,
      maxAmount: 100,
      maxAge: 60000,
      auth: () => null,
      manualResponse: false,
      resType: "json",
      shouldCache: () => true,
      resolver: new MemoryResolver()
    }

    if (options)
      Object.assign(_default, options)
    this.options = _default

    if (this.options.minAmount >= this.options.maxAmount) {
      throw "TRESOR: minAmount cannot be greater or equal than maxAmount"
    }

    if (this.options.maxAmount < 1) {
      throw "TRESOR: maxAmount needs to be 1 or higher"
    }

    if (this.options.maxAge < 1) {
      throw "TRESOR: maxAge needs to be 1 or higher"
    }
  }

  private sendCached(res: express.Response, value: string) {
    if (this.options.resType === "json")
      res.json(JSON.parse(value))
    else if (this.options.resType === "html")
      res.send(value)
  }

  init() {
    return this.middleware()
  }

  middleware() {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const beforeCache = +new Date()
      const auth = this.options.auth(req, res)
      const cached = await this.options.resolver.checkCache(req.originalUrl, auth, this.options)

      if (cached != null) {

        if (this.options.onCacheHit)
          this.options.onCacheHit(req.originalUrl, new Date().valueOf() - beforeCache)

        if (this.options.manualResponse === false) {
          return this.sendCached(res, cached)
        }

        req.$tresor = {
          isCached: true,
          value: cached,
          instance: this
        }
      }
      else {
        if (this.options.onCacheMiss)
          this.options.onCacheMiss(req.originalUrl, new Date().valueOf() - beforeCache)
      }

      const cacheFun = async (value: object | string) => {
        let _value = value as string

        if (typeof value == "object")
          _value = JSON.stringify(value)

        if (this.options.shouldCache(req, res))
          await this.options.resolver.tryCache(req.originalUrl, auth, _value, this.options)
        return _value
      }

      res.$tresor = {
        send: async (value: object | string) => {
          const _value = await res.$tresor.cache(value)
          this.sendCached(res, _value)
          return _value
        },
        cache: cacheFun
      }

      next()
    }
  }

  async clear(): Promise<void> {
    await this.options.resolver.clear()
  }
}

import { MemoryResolver } from "./resolvers/memory"
export { MemoryResolver }
import { FileResolver } from "./resolvers/file"
export { FileResolver }
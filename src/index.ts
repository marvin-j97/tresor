import express from "express"

interface ITresorInject {
  isCached: boolean;
  value: string;
}

export interface IResolverContext {
  path: string;
  auth: string | null;
  options: ITresorOptions;
}

declare global {
  namespace Express {
    export interface Request {
      $tresor?: ITresorInject
    }
    export interface Response {
      $tresor: (value: object | string) => void
    }
  }
}

type AuthFunction = (req: express.Request) => string | null;
type CacheItem = { path: string, auth: string | null, storedOn: number }

export interface ITresorOptions {
  maxAmount: number
  maxAge: number
  resolver: BaseResolver
  auth: AuthFunction
  manualResponse: boolean
  resType: "json" | "html"
  shouldCache: (req: express.Request, res: express.Response) => boolean
  onCacheHit?: (path: string, time: number) => void
  onCacheMiss?: (path: string, time: number) => void
}

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
    const index = this.items.findIndex(
      item => item.path == context.path && item.auth == context.auth
    )
    if (index > -1)
      this.items.splice(index, 1)
  }

  public async checkCache(req: express.Request, options: ITresorOptions): Promise<string | null> {
    const auth = options.auth(req)
    const item = this.getItem(req.originalUrl, auth, options)

    if (item) {
      if (item.storedOn < (new Date().valueOf() - options.maxAge)) {
        // Cache miss: Cached item too old
        this.removeItem({ path: req.originalUrl, auth, options })
        return null
      }
      else {
        // Cache hit
        const cached = await this.retrieve({ path: req.originalUrl, auth, options })
        return cached
      }
    }
    else {
      // Cache miss: No item
      return null
    }
  }

  public async tryCache(value: string, req: express.Request, options: ITresorOptions) {
    const auth = options.auth(req)
    const item = this.getItem(req.originalUrl, auth, options)

    if (!item) {
      if (this.amount() == options.maxAmount) {
        const oldest = (<CacheItem>this.items.shift())
        await this.removeItem({ path: oldest.path, auth: oldest.auth, options })
      }
      await this.storeItem({ path: req.originalUrl, auth, options }, value)
    }
  }

  public async clear() {
    await this.clearSelf();
    this.items = [];
  }

  protected abstract store(context: IResolverContext, value: string): Promise<void>
  protected abstract retrieve(context: IResolverContext): Promise<string | null>
  protected abstract remove(context: IResolverContext): Promise<void>
  protected abstract clearSelf(): Promise<void>;
}

export class Tresor {
  options: ITresorOptions

  constructor(options?: Partial<ITresorOptions>) {
    const _default: ITresorOptions = {
      maxAmount: 100,
      maxAge: 60000,
      auth: () => null,
      manualResponse: false,
      resType: "json",
      shouldCache: (req: express.Request, res: express.Response) => true,
      resolver: new MemoryResolver()
    }

    Object.assign(_default, options)
    this.options = _default

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
    return this.middleware();
  }

  middleware() {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const beforeCache = +new Date();
      const cached = await this.options.resolver.checkCache(req, this.options)

      if (cached != null) {

        if (this.options.onCacheHit)
          this.options.onCacheHit(req.originalUrl, new Date().valueOf() - beforeCache);

        if (this.options.manualResponse === false) {
          return this.sendCached(res, cached)
        }

        req.$tresor = {
          isCached: true,
          value: cached
        }
      }
      else {
        if (this.options.onCacheMiss)
          this.options.onCacheMiss(req.originalUrl, new Date().valueOf() - beforeCache);
      }

      res.$tresor = async (value: object | string) => {
        let _value = value as string

        if (typeof value == "object")
          _value = JSON.stringify(value);

        if (this.options.shouldCache(req, res))
          await this.options.resolver.tryCache(_value, req, this.options)
        this.sendCached(res, _value)
      }

      next()
    }
  }

  async clear(): Promise<void> {
    await this.options.resolver.clear();
  }
}

import { MemoryResolver } from "./resolvers/memory"
export { MemoryResolver }
import { FileResolver } from "./resolvers/file"
export { FileResolver }
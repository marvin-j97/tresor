import express from "express"

type AuthFunction = (req: express.Request) => string | null;

export interface ITresorOptions {
  maxAmount?: number
  maxAge?: number
  resolver?: BaseResolver
  auth?: AuthFunction
  manualResponse?: boolean
  resType?: "json" | "html" | string
  shouldCache?: (req: express.Request) => boolean
  onCacheHit?: (path: string, time: number) => void
  onCacheMiss?: (path: string, time: number) => void
}

type CacheItem = { path: string, auth: string | null, storedOn: number }

export abstract class BaseResolver {
  protected items = [] as CacheItem[]

  private amount() {
    return this.items.length
  }

  private getItem(path: string, auth: string | null) {
    return this.items.find(item => item.path == path && item.auth == auth)
  }

  private async storeItem(path: string, auth: string | null, value: string) {
    await this.store(path, auth, value)
    this.items.push({
      path,
      auth,
      storedOn: +new Date
    })
  }

  private async removeItem(path: string, auth: string | null) {
    await this.remove(path, auth)
    const index = this.items.findIndex(
      item => item.path == path && item.auth == auth
    )
    if (index > -1)
      this.items.splice(index, 1)
  }

  public async checkCache(req: express.Request, options: ITresorOptions): Promise<string | null> {
    const auth = (<AuthFunction>(<any>options).auth)(req)
    const item = this.getItem(req.originalUrl, auth)

    if (item) {
      if (item.storedOn < (new Date().valueOf() - (<number>options.maxAge))) {
        // Cache miss: Cached item too old
        this.removeItem(req.originalUrl, auth)
        return null
      }
      else {
        // Cache hit
        const cached = await this.retrieve(req.originalUrl, auth)
        return cached
      }
    }
    else {
      // Cache miss: No item
      return null
    }
  }

  public async tryCache(value: string, req: express.Request, options: ITresorOptions) {
    const auth = (<AuthFunction>(<any>options).auth)(req)
    const item = this.getItem(req.originalUrl, auth)

    if (!item) {
      if (this.amount() == (<number>options.maxAmount)) {
        const oldest = (<CacheItem>this.items.shift())
        await this.remove(oldest.path, oldest.auth)
      }

      await this.storeItem(req.originalUrl, auth, value)
    }
  }

  public async clear() {
    await this.clearSelf();
    this.items = [];
  }

  protected abstract store(path: string, auth: string | null, value: string): Promise<void>
  protected abstract retrieve(path: string, auth: string | null): Promise<string | null>
  protected abstract remove(path: string, auth: string | null): Promise<void>
  protected abstract clearSelf(): Promise<void>;
}

export class MemoryResolver extends BaseResolver {
  private internalStore = [] as { path: string, auth: string | null, value: string }[];

  async store(path: string, auth: string | null, value: string) {
    this.internalStore.push({
      path,
      auth,
      value
    })
  }

  async retrieve(path: string, auth: string | null) {
    const item = this.internalStore.find(
      item => item.path == path && item.auth == auth
    )

    return item ? item.value : null
  }

  async remove(path: string, auth: string | null) {
    const index = this.internalStore.findIndex(
      item => item.path == path && item.auth == auth
    )
    if (index > -1)
      this.internalStore.splice(index, 1)
  }

  async clearSelf() {
    this.internalStore = []
  }
}

interface ITresorInject {
  isCached: boolean;
  value: string;
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

export class Tresor {
  options: ITresorOptions

  constructor(options?: ITresorOptions) {
    const _default: ITresorOptions = {
      maxAmount: 100,
      maxAge: 60000,
      auth: () => null,
      manualResponse: false,
      resType: "json",
      shouldCache: (req: express.Request) => req.method == "GET",
      resolver: new MemoryResolver()
    }

    Object.assign(_default, options)
    this.options = _default
  }

  private sendCached(res: express.Response, value: string) {
    if (this.options.resType === "json")
      res.json(JSON.parse(value))
    else if (this.options.resType === "html")
      res.send(value)
  }

  middleware() {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const beforeCache = +new Date();
      const cached = await (<BaseResolver>this.options.resolver).checkCache(req, this.options)

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

        (<BaseResolver>this.options.resolver).tryCache(_value, req, this.options)
        this.sendCached(res, _value)
      }

      next()
    }
  }

  async clear(): Promise<void> {
    await (<BaseResolver>this.options.resolver).clear();
  }
}
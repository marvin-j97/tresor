import express from "express";
import { parseDuration } from "./time_extractor";
import { ITresorOptions } from "./types";

// Tresor instance
// Use .init() or .middleware() when adding to an Express route
export class Tresor {
  options: ITresorOptions;

  resolver() {
    return this.options.resolver;
  }

  static html(options?: Partial<Omit<ITresorOptions, "responseType">>) {
    let _options = {
      ...options,
      responseType: "html" as "html"
    };

    return new Tresor(_options);
  }

  static json(options?: Partial<Omit<ITresorOptions, "responseType">>) {
    let _options = {
      ...options,
      responseType: "json" as "json"
    };

    return new Tresor(_options);
  }

  constructor(options?: Partial<ITresorOptions>) {
    const _default: ITresorOptions = {
      minSize: 0,
      maxSize: 100,
      maxAge: parseDuration("5 min"),
      auth: () => null,
      manualResponse: false,
      responseType: "json",
      shouldCache: () => true,
      resolver: new MemoryResolver()
    };

    if (options) Object.assign(_default, options);
    this.options = _default;

    this.options.maxAge = parseDuration(this.options.maxAge);

    if (this.options.minSize >= this.options.maxSize) {
      throw "TRESOR: minAmount cannot be greater or equal than maxAmount";
    }

    if (this.options.maxSize < 1) {
      throw "TRESOR: maxAmount needs to be 1 or higher";
    }

    if (this.options.maxAge < 1) {
      throw "TRESOR: maxAge needs to be 1 or higher";
    }
  }

  private sendCached(res: express.Response, value: string) {
    if (this.options.responseType === "json") res.json(JSON.parse(value));
    else if (this.options.responseType === "html") res.send(value);
  }

  init() {
    return this.middleware();
  }

  middleware() {
    return async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const beforeCache = +new Date();
      const auth = this.options.auth(req, res);
      const cached = await this.resolver().checkCache(
        req.originalUrl,
        auth,
        this.options
      );

      if (cached != null) {
        if (this.options.onCacheHit)
          this.options.onCacheHit(
            req.originalUrl,
            new Date().valueOf() - beforeCache
          );

        if (this.options.manualResponse === false) {
          return this.sendCached(res, cached);
        }

        req.$tresor = {
          isCached: true,
          value: cached,
          instance: this
        };
      } else {
        if (this.options.onCacheMiss)
          this.options.onCacheMiss(
            req.originalUrl,
            new Date().valueOf() - beforeCache
          );
      }

      const cacheFun = async (value: object | string) => {
        let _value = value as string;

        if (typeof value == "object") _value = JSON.stringify(value);

        if (this.options.shouldCache(req, res))
          await this.resolver().addToCache(
            req.originalUrl,
            auth,
            _value,
            this.options
          );
        return _value;
      };

      res.$tresor = {
        send: async (value: object | string) => {
          const _value = await res.$tresor.cache(value);
          this.sendCached(res, _value);
          return _value;
        },
        cache: cacheFun
      };

      next();
    };
  }

  async clear(): Promise<void> {
    await this.resolver().clear();
  }

  async invalidate(path: string, auth: string | null) {
    await this.resolver().removeItem({
      path,
      auth,
      options: this.options
    });
  }
}

import { MemoryResolver } from "./resolvers/memory";
export { MemoryResolver };
import { FileResolver } from "./resolvers/file";
export { FileResolver };
import { BaseResolver } from "./resolvers/base";
export { BaseResolver };
export * from "./types";

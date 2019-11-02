import { parseDuration } from "./time_extractor";
import { ITresorOptions } from "./types";
import { MemoryAdapter } from "./adapters/memory";
import { FileAdapter } from "./adapters/file";
import { BaseAdapter } from "./adapters/base";
import { IDiscardStrategy } from "./discard_strategies/index";
import { FIFOStrategy } from "./discard_strategies/fifo";
import { LIFOStrategy } from "./discard_strategies/lifo";

// Tresor instance
export class Tresor {
  protected options: ITresorOptions;

  constructor(options?: Partial<ITresorOptions>) {
    this.options = {
      maxSize: 100,
      maxAge: parseDuration("5 min"),
      adapter: new MemoryAdapter(),
      discardStrategy: new FIFOStrategy()
    };

    if (options) Object.assign(this.options, options);
    this.options.maxAge = parseDuration(this.options.maxAge);

    if (this.options.maxSize < 1) {
      throw "TRESOR: maxAmount needs to be 1 or higher";
    }
    if (this.options.maxAge < 1) {
      throw "TRESOR: maxAge needs to be 1 or higher";
    }
  }

  public async checkCache(path: string, auth: string | null) {
    return this.adapter().checkCache({
      path,
      auth,
      options: this.options
    });
  }

  public async addToCache(path: string, auth: string | null, value: string) {
    return this.adapter().addToCache(
      {
        path,
        auth,
        options: this.options
      },
      value
    );
  }

  public getOpts() {
    return this.options;
  }

  public getOptions() {
    return this.options;
  }

  public adapter() {
    return this.options.adapter;
  }

  public async clear(): Promise<void> {
    return this.adapter().clear();
  }

  public async invalidate(path: string, auth: string | null) {
    return this.adapter().clearItem({
      path,
      auth,
      options: this.options
    });
  }
}

export { MemoryAdapter };
export { FileAdapter };
export { BaseAdapter };

export { IDiscardStrategy };
export { FIFOStrategy };
export { LIFOStrategy };

export * from "./types";

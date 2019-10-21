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
  options: ITresorOptions;

  adapter() {
    return this.options.adapter;
  }

  constructor(options?: Partial<ITresorOptions>) {
    const _default: ITresorOptions = {
      maxSize: 100,
      maxAge: parseDuration("5 min"),
      adapter: new MemoryAdapter(),
      discardStrategy: new FIFOStrategy()
    };

    if (options) Object.assign(_default, options);
    this.options = _default;

    this.options.maxAge = parseDuration(this.options.maxAge);

    if (this.options.maxSize < 1) {
      throw "TRESOR: maxAmount needs to be 1 or higher";
    }

    if (this.options.maxAge < 1) {
      throw "TRESOR: maxAge needs to be 1 or higher";
    }
  }

  async clear(): Promise<void> {
    await this.adapter().clear();
  }

  async invalidate(path: string, auth: string | null) {
    await this.adapter().clearItem({
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

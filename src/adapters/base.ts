import { CacheItem, IAdapterContext, ITresorOptions, HashMap } from "../types";
import sha1 from "sha1";
import { parseDuration } from "../time_extractor";

// Base class to create new Adapters
// Public methods should not be called by the deriving Adapters
export abstract class BaseAdapter {
  protected items = {} as HashMap<CacheItem>;
  protected hashes = [] as string[];
  private numItems = 0;
  private timers = {} as HashMap<NodeJS.Timeout>;

  private removeTimer(key: string) {
    const timer = this.timers[key];
    if (timer) clearTimeout(timer);
    delete this.timers[key];
  }

  private getTimers() {
    return Object.keys(this.timers).map(hash => this.timers[hash]);
  }

  public size() {
    return this.numItems;
  }

  private getItem(key: string) {
    return this.items[key];
  }

  private async storeItem(key: string, value: string, options: ITresorOptions) {
    await this.store(key, value, options);
    this.items[key] = {
      storedOn: +new Date()
    };
    this.timers[key] = setTimeout(
      () => {
        this.removeItem(key, options);
      },
      typeof options.maxAge == "string"
        ? parseDuration(options.maxAge)
        : options.maxAge
    );
    this.numItems++;
    this.hashes.push(key);
  }

  public async removeItem(key: string, options: ITresorOptions) {
    await this.remove(key, options);
    delete this.items[key];
    this.hashes = this.hashes.filter(hash => hash != key);
    this.removeTimer(key);
    this.numItems--;
  }

  public async checkCache({
    path,
    auth,
    options
  }: IAdapterContext): Promise<string | null> {
    const hash = sha1(path + auth);
    const item = this.getItem(hash);

    if (item) {
      // minAmount will ignore cache age as long as there are less items in cache than minAmount
      if (item.storedOn < new Date().valueOf() - <number>options.maxAge) {
        // Cache miss: Cached item too old && minAmount reached
        this.removeItem(hash, options);
        return null;
      } else {
        // Cache hit: Retrieve and return
        const cached = await this.retrieve(hash, options);
        return cached;
      }
    } else {
      // Cache miss: No item
      return null;
    }
  }

  private async removeIndex(index: number, options: ITresorOptions) {
    const hash = this.hashes[index];
    if (hash) {
      await this.removeItem(hash, options);
    }
  }

  public async addToCache(
    { path, auth, options }: IAdapterContext,
    value: string
  ) {
    const hash = sha1(path + auth);
    const item = this.getItem(hash);

    if (!item) {
      if (this.size() == options.maxSize) {
        // Cache full
        // When an item is added when the cache is full,
        // let the discard strategy choose an item to remove
        await this.removeIndex(
          options.discardStrategy.choose(
            this.hashes.map(hash => this.items[hash]),
            options
          ),
          options
        );

        if (options.onCacheFull) options.onCacheFull();
      }
      // Store new item
      await this.storeItem(hash, value, options);
      if (options.onStore) options.onStore(path, this.numItems);
    }
  }

  public async clearItem({ path, auth, options }: IAdapterContext) {
    await this.removeItem(sha1(path + auth), options);
  }

  public async clear() {
    await this.clearSelf();
    this.getTimers().forEach(timer => clearTimeout(timer));
    this.timers = {};
    this.items = {};
    this.hashes = [];
    this.numItems = 0;
  }

  protected abstract store(
    key: string,
    value: string,
    options: ITresorOptions
  ): Promise<void>;
  protected abstract retrieve(
    key: string,
    options: ITresorOptions
  ): Promise<string | null>;
  protected abstract remove(
    key: string,
    options: ITresorOptions
  ): Promise<void>;
  protected abstract clearSelf(): Promise<void>;
}

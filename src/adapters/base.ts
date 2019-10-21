import { CacheItem, IAdapterContext, ITresorOptions, HashMap } from "../types";
import sha1 from "sha1";
import { parseDuration } from "../time_extractor";

// Base class to create new Adapters
// Public methods should not be called by the deriving Adapters
export abstract class BaseAdapter {
  protected items = [] as CacheItem[];
  private timers = {} as HashMap<NodeJS.Timeout>;

  private removeTimer(key: string) {
    const timer = this.getTimer(key);
    if (timer) clearTimeout(timer);
    delete this.timers[key];
  }

  private getTimer(key: string) {
    return this.timers[key];
  }

  private getTimers() {
    return Object.keys(this.timers).map(this.getTimer);
  }

  public size() {
    return this.items.length;
  }

  private getItem({ path, auth }: IAdapterContext) {
    return this.items.find(item => item.path == path && item.auth == auth);
  }

  private async storeItem(context: IAdapterContext, value: string) {
    await this.store(context, value);
    this.items.push({
      path: context.path,
      auth: context.auth,
      storedOn: +new Date()
    });
    const hash = sha1(context.path + context.auth);
    this.timers[hash] = setTimeout(
      () => {
        this.removeItem(context);
      },
      typeof context.options.maxAge == "string"
        ? parseDuration(context.options.maxAge)
        : context.options.maxAge
    );

    if (context.options.onStore)
      context.options.onStore(context.path, this.items.length);
  }

  public async removeItem(context: IAdapterContext) {
    await this.remove(context);
    this.items = this.items.filter(
      item => !(item.path == context.path && item.auth == context.auth)
    );
    const hash = sha1(context.path + context.auth);
    this.removeTimer(hash);
  }

  public async checkCache({
    path,
    auth,
    options
  }: IAdapterContext): Promise<string | null> {
    const item = this.getItem({ path, auth, options });

    if (item) {
      // minAmount will ignore cache age as long as there are less items in cache than minAmount
      if (item.storedOn < new Date().valueOf() - <number>options.maxAge) {
        // Cache miss: Cached item too old && minAmount reached
        this.removeItem({ path, auth, options });
        return null;
      } else {
        // Cache hit: Retrieve and return
        const cached = await this.retrieve({ path, auth, options });
        return cached;
      }
    } else {
      // Cache miss: No item
      return null;
    }
  }

  private async removeOldest(options: ITresorOptions) {
    const oldest = <CacheItem>this.items.shift();
    await this.removeItem({ path: oldest.path, auth: oldest.auth, options });
  }

  public async addToCache(
    { path, auth, options }: IAdapterContext,
    value: string
  ) {
    const item = this.getItem({ path, auth, options });

    if (!item) {
      if (this.size() == options.maxSize) {
        // Cache full
        // When an item is added when the cache is full, the oldest cache item is removed (FIFO)
        await this.removeOldest(options);

        if (options.onCacheFull) options.onCacheFull();
      }
      // Store new item
      await this.storeItem({ path, auth, options }, value);
    }
  }

  public async clear() {
    await this.clearSelf();
    this.getTimers().forEach(timer => clearTimeout(timer));
    this.timers = {};
    this.items = [];
  }

  protected abstract store(
    context: IAdapterContext,
    value: string
  ): Promise<void>;
  protected abstract retrieve(context: IAdapterContext): Promise<string | null>;
  protected abstract remove(context: IAdapterContext): Promise<void>;
  protected abstract clearSelf(): Promise<void>;
}

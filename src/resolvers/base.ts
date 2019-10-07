import { CacheItem, IResolverContext, ITresorOptions } from "../types";

// Base class to create new Resolvers
// Public methods should not be called by the deriving resolvers
export abstract class BaseResolver {
  protected items = [] as CacheItem[];

  public size() {
    return this.items.length;
  }

  private getItem(path: string, auth: string | null, options: ITresorOptions) {
    return this.items.find(item => item.path == path && item.auth == auth);
  }

  private async storeItem(context: IResolverContext, value: string) {
    await this.store(context, value);
    this.items.push({
      path: context.path,
      auth: context.auth,
      storedOn: +new Date()
    });

    if (context.options.onStore)
      context.options.onStore(context.path, this.items.length);
  }

  public async removeItem(context: IResolverContext) {
    await this.remove(context);
    this.items = this.items.filter(
      item => !(item.path == context.path && item.auth == context.auth)
    );
  }

  public async checkCache(
    path: string,
    auth: string | null,
    options: ITresorOptions
  ): Promise<string | null> {
    const item = this.getItem(path, auth, options);

    if (item) {
      // minAmount will ignore cache age as long as there are less items in cache than minAmount
      if (
        item.storedOn < new Date().valueOf() - <number>options.maxAge &&
        this.size() > options.minSize
      ) {
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
    path: string,
    auth: string | null,
    value: string,
    options: ITresorOptions
  ) {
    const item = this.getItem(path, auth, options);

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
    this.items = [];
  }

  protected abstract store(
    context: IResolverContext,
    value: string
  ): Promise<void>;
  protected abstract retrieve(
    context: IResolverContext
  ): Promise<string | null>;
  protected abstract remove(context: IResolverContext): Promise<void>;
  protected abstract clearSelf(): Promise<void>;
}

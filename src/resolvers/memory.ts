import { BaseResolver } from "./base";
import { IResolverContext } from "../types";
import md5 from "md5";

// Resolver using in-memory cache (default)
// Hash indices are computed by hashing the http path + the authorization string using MD5
export class MemoryResolver extends BaseResolver {
  private internalStore = {} as { [key: string]: string };

  async store(context: IResolverContext, value: string) {
    this.internalStore[md5(context.path + context.auth)] = value;
  }

  async retrieve(context: IResolverContext) {
    const value = this.internalStore[md5(context.path + context.auth)];
    return value ? value : null;
  }

  async remove(context: IResolverContext) {
    delete this.internalStore[md5(context.path + context.auth)];
  }

  async clearSelf() {
    this.internalStore = {};
  }
}

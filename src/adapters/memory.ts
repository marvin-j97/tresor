import { BaseAdapter } from "./base";
import { IAdapterContext } from "../types";
import md5 from "md5";

// Adapter using in-memory cache (default)
// Hash indices are computed by hashing the http path + the authorization string using MD5
export class MemoryAdapter extends BaseAdapter {
  private internalStore = {} as { [key: string]: string };

  async store(context: IAdapterContext, value: string) {
    this.internalStore[md5(context.path + context.auth)] = value;
  }

  async retrieve(context: IAdapterContext) {
    const value = this.internalStore[md5(context.path + context.auth)];
    return value ? value : null;
  }

  async remove(context: IAdapterContext) {
    delete this.internalStore[md5(context.path + context.auth)];
  }

  async clearSelf() {
    this.internalStore = {};
  }
}

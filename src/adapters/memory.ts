import { BaseAdapter } from "./base";
import { IAdapterContext } from "../types";
import sha1 from "sha1";

// Adapter using in-memory cache (default)
// Hash indices are computed by hashing the http path + the authorization string using MD5
export class MemoryAdapter extends BaseAdapter {
  private internalStore = {} as { [key: string]: string };

  async store(context: IAdapterContext, value: string) {
    this.internalStore[sha1(context.path + context.auth)] = value;
  }

  async retrieve(context: IAdapterContext) {
    const value = this.internalStore[sha1(context.path + context.auth)];
    return value ? value : null;
  }

  async remove(context: IAdapterContext) {
    delete this.internalStore[sha1(context.path + context.auth)];
  }

  async clearSelf() {
    this.internalStore = {};
  }
}

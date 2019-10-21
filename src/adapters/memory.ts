import { BaseAdapter } from "./base";
import { ITresorOptions } from "../types";

// Adapter using in-memory cache (default)
// Hash indices are computed by hashing the http path + the authorization string using MD5
export class MemoryAdapter extends BaseAdapter {
  private internalStore = {} as { [key: string]: string };

  async store(key: string, value: string, options: ITresorOptions) {
    this.internalStore[key] = value;
  }

  async retrieve(key: string, options: ITresorOptions) {
    const value = this.internalStore[key];
    return value ? value : null;
  }

  async remove(key: string, options: ITresorOptions) {
    delete this.internalStore[key];
  }

  async clearSelf() {
    this.internalStore = {};
  }
}

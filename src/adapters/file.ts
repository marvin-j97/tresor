import { BaseAdapter } from "./base";
import { ITresorOptions } from "../types";
import nodePath from "path";
import { promisify } from "util";
import { exists, readFile, writeFile, unlink, mkdir } from "fs";

const promiseExist = promisify(exists);
const promiseRead = promisify(readFile);
const promiseWrite = promisify(writeFile);
const promiseUnlink = promisify(unlink);
const promiseMkdir = promisify(mkdir);

// Adapter using the file system
// Base path can be changed on constructoring, and default to ./tresor_cache
// File names are determined by hashing the http path + the authorization string using MD5
export class FileAdapter extends BaseAdapter {
  private files = [] as string[];
  private basePath: string;

  constructor(basePath?: string) {
    super();
    this.basePath = basePath || "./tresor_cache";
    const folder = nodePath.join(process.cwd(), this.basePath);
    promiseMkdir(nodePath.relative(process.cwd(), folder), {
      recursive: true
    }).catch(err => {});
  }

  private filePath(key: string, ext: "json" | "html") {
    const folder = nodePath.join(process.cwd(), this.basePath);
    const filePath = nodePath.join(folder, key + "." + ext);
    return filePath;
  }

  private async getFile(
    key: string,
    ext: "json" | "html"
  ): Promise<string | null> {
    try {
      const filePath = this.filePath(key, ext);

      if (await promiseExist(filePath))
        return await promiseRead(filePath, "utf-8");
      return null;
    } catch (err) {
      throw err;
    }
  }

  async store(key: string, value: string, options: ITresorOptions) {
    try {
      const filePath = this.filePath(key, options.responseType);
      await promiseWrite(filePath, value);
      this.files.push(filePath);
    } catch (err) {
      throw err;
    }
  }

  async retrieve(key: string, options: ITresorOptions) {
    const content = await this.getFile(key, options.responseType);
    return content;
  }

  async remove(key: string, options: ITresorOptions) {
    try {
      const filePath = this.filePath(key, options.responseType);
      if (await promiseExist(filePath)) {
        await promiseUnlink(filePath);

        this.files = this.files.filter(item => item != filePath);
      }
    } catch (err) {
      throw err;
    }
  }

  async clearSelf() {
    for (const file of this.files) {
      try {
        await promiseUnlink(file);
      } catch (err) {}
    }
    this.files = [];
  }
}

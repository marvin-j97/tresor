import { BaseAdapter } from "./base";
import { IAdapterContext } from "../types";
import md5 from "md5";
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
    promiseMkdir(nodePath.relative(process.cwd(), folder), { recursive: true });
  }

  private filePath(path: string, auth: string | null, ext: "json" | "html") {
    const hash = md5(path + auth);
    const folder = nodePath.join(process.cwd(), this.basePath);
    const filePath = nodePath.join(folder, hash + "." + ext);
    return filePath;
  }

  private async getFile(
    path: string,
    auth: string | null,
    ext: "json" | "html"
  ): Promise<string | null> {
    try {
      const filePath = this.filePath(path, auth, ext);

      if (await promiseExist(filePath))
        return await promiseRead(filePath, "utf-8");
      return null;
    } catch (err) {
      throw err;
    }
  }

  async store(context: IAdapterContext, value: string) {
    try {
      const filePath = this.filePath(
        context.path,
        context.auth,
        context.options.responseType
      );
      await promiseWrite(filePath, value);
      this.files.push(filePath);
    } catch (err) {
      throw err;
    }
  }

  async retrieve(context: IAdapterContext) {
    const content = await this.getFile(
      context.path,
      context.auth,
      context.options.responseType
    );
    return content;
  }

  async remove(context: IAdapterContext) {
    try {
      const filePath = this.filePath(
        context.path,
        context.auth,
        context.options.responseType
      );
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

import { BaseResolver, ITresorOptions, IResolverContext } from "../index";
import md5 from "md5";
import nodePath from "path";
import { promisify } from "util";
import { exists, readFile, writeFile, unlink } from "fs";

const promiseExist = promisify(exists);
const promiseRead = promisify(readFile);
const promiseWrite = promisify(writeFile);
const promiseUnlink = promisify(unlink);
const mkdirp = require("mkdirp");

// Resolver using the file system
// Base path can be changed on constructoring, and default to ./tresor_cache
// File names are determined by hashing the http path + the authorization string using MD5
export class FileResolver extends BaseResolver {
  private files = [] as string[];
  private basePath: string;

  constructor(basePath?: string) {
    super();
    this.basePath = basePath || "./tresor_cache";
    const folder = nodePath.join(process.cwd(), this.basePath);
    mkdirp(nodePath.relative(process.cwd(), folder), (err: any) => {});
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

  async store(context: IResolverContext, value: string) {
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

  async retrieve(context: IResolverContext) {
    const content = await this.getFile(
      context.path,
      context.auth,
      context.options.responseType
    );
    return content;
  }

  async remove(context: IResolverContext) {
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

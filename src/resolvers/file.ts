import { BaseResolver, ITresorOptions, IResolverContext } from "../index";
import md5 from "md5";
import nodePath from "path";

import { promisify } from "util";
import { exists, readFile, writeFile, unlink } from "fs";

const promiseExist = promisify(exists);
const promiseRead = promisify(readFile);
const promiseWrite = promisify(writeFile);
const promiseUnlink = promisify(unlink);

var mkdirp = require('mkdirp');

export class FileResolver extends BaseResolver {

  private files = [] as string[];
  private basePath: string;

  constructor(basePath?: string) {
    super();
    this.basePath = basePath || "./tresor_cache";
    const folder = nodePath.join(process.cwd(), this.basePath);

    (async () => {
      mkdirp(nodePath.relative(process.cwd(), folder), (err: any) => { });
    })();
  }

  private filePath(path: string, auth: string | null, ext: "json" | "html") {
    const hash = md5(path + auth);
    const folder = nodePath.join(process.cwd(), this.basePath);
    const filePath = nodePath.join(folder, hash + "." + ext);
    return filePath;
  }

  private async getFile(path: string, auth: string | null, options: ITresorOptions): Promise<string | null> {
    try {
      const filePath = this.filePath(path, auth, options.resType);

      if (await promiseExist(filePath))
        return await promiseRead(filePath, "utf-8");
      return null;
    }
    catch (err) {
      throw err;
    }
  }

  async store(context: IResolverContext, value: string) {
    try {
      const filePath = this.filePath(context.path, context.auth, context.options.resType);
      await promiseWrite(filePath, value);
      this.files.push(filePath);
    }
    catch (err) {
      throw err;
    }
  }

  async retrieve(context: IResolverContext) {
    const content = await this.getFile(context.path, context.auth, context.options);
    return content;
  }

  async remove(context: IResolverContext) {
    try {
      const filePath = this.filePath(context.path, context.auth, context.options.resType);
      if (await promiseExist(filePath)) {
        await promiseUnlink(filePath);

        this.files = this.files.filter(item => item != filePath)
      }
    }
    catch (err) {
      throw err;
    }
  }

  async clearSelf() {
    for (const file of this.files) {
      try {
        await promiseUnlink(file);
      }
      catch (err) { }
    }
    this.files = [];
  }
}
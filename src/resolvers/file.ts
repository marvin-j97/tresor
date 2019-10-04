import { BaseResolver, ITresorOptions } from "../index";
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
    this.basePath = basePath || "./cache";
    const folder = nodePath.join(process.cwd(), this.basePath);

    (async () => {
      mkdirp(nodePath.relative(process.cwd(), folder), (err: any) => {});
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
      const filePath = this.filePath(path, auth, (<"json" | "html">options.resType));

      if (await promiseExist(filePath))
        return await promiseRead(filePath, "utf-8");
      return null;
    }
    catch (err) {
      throw err;
    }
  }

  async store(path: string, auth: string | null, value: string, options: ITresorOptions) {
    try {
      const filePath = this.filePath(path, auth, (<"json" | "html">options.resType));
      await promiseWrite(filePath, value);
      this.files.push(filePath);
    }
    catch (err) {
      throw err;
    }
  }

  async retrieve(path: string, auth: string | null, options: ITresorOptions) {
    const content = await this.getFile(path, auth, options);
    return content;
  }

  async remove(path: string, auth: string | null, options: ITresorOptions) {
    try {
      const filePath = this.filePath(path, auth, (<"json" | "html">options.resType));
      if (await promiseExist(filePath)) {
        await promiseUnlink(filePath);

        const index = this.files.findIndex(item => item == filePath)
        if (index > -1)
          this.files.splice(index, 1)
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
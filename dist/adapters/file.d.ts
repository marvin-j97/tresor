import { BaseAdapter } from "./base";
import { ITresorOptions } from "../types";
export declare class FileAdapter extends BaseAdapter {
    private files;
    private basePath;
    constructor(basePath?: string);
    private filePath;
    private getFile;
    store(key: string, value: string, options: ITresorOptions): Promise<void>;
    retrieve(key: string, options: ITresorOptions): Promise<string | null>;
    remove(key: string, options: ITresorOptions): Promise<void>;
    clearSelf(): Promise<void>;
}

import { BaseAdapter } from "./base";
import { IAdapterContext } from "../types";
export declare class FileAdapter extends BaseAdapter {
    private files;
    private basePath;
    constructor(basePath?: string);
    private filePath;
    private getFile;
    store(context: IAdapterContext, value: string): Promise<void>;
    retrieve(context: IAdapterContext): Promise<string | null>;
    remove(context: IAdapterContext): Promise<void>;
    clearSelf(): Promise<void>;
}

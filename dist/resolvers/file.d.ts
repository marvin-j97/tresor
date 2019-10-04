import { BaseResolver, IResolverContext } from "../index";
export declare class FileResolver extends BaseResolver {
    private files;
    private basePath;
    constructor(basePath?: string);
    private filePath;
    private getFile;
    store(context: IResolverContext, value: string): Promise<void>;
    retrieve(context: IResolverContext): Promise<string | null>;
    remove(context: IResolverContext): Promise<void>;
    clearSelf(): Promise<void>;
}

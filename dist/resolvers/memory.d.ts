import { BaseResolver, IResolverContext } from "../index";
export declare class MemoryResolver extends BaseResolver {
    private internalStore;
    store(context: IResolverContext, value: string): Promise<void>;
    retrieve(context: IResolverContext): Promise<string | null>;
    remove(context: IResolverContext): Promise<void>;
    clearSelf(): Promise<void>;
}

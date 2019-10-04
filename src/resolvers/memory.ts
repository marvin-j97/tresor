import { BaseResolver, ITresorOptions, IResolverContext } from "../index";

export class MemoryResolver extends BaseResolver {
  private internalStore = [] as { path: string, auth: string | null, value: string }[];

  async store(context: IResolverContext, value: string) {
    this.internalStore.push({
      path: context.path,
      auth: context.auth,
      value
    })
  }

  async retrieve(context: IResolverContext) {
    const item = this.internalStore.find(
      item => item.path == context.path && item.auth == context.auth
    )

    return item ? item.value : null
  }

  async remove(context: IResolverContext) {
    this.internalStore = this.internalStore.filter(item => !(item.path == context.path && item.auth == context.auth))
  }

  async clearSelf() {
    this.internalStore = []
  }
}
import { BaseResolver, ITresorOptions } from "../index";

export class MemoryResolver extends BaseResolver {
  private internalStore = [] as { path: string, auth: string | null, value: string }[];

  async store(path: string, auth: string | null, value: string, options: ITresorOptions) {
    this.internalStore.push({
      path,
      auth,
      value
    })
  }

  async retrieve(path: string, auth: string | null, options: ITresorOptions) {
    const item = this.internalStore.find(
      item => item.path == path && item.auth == auth
    )

    return item ? item.value : null
  }

  async remove(path: string, auth: string | null, options: ITresorOptions) {
    const index = this.internalStore.findIndex(
      item => item.path == path && item.auth == auth
    )
    if (index > -1)
      this.internalStore.splice(index, 1)
  }

  async clearSelf() {
    this.internalStore = []
  }
}
import express from "express"
import { Tresor, FileResolver } from "../../src/index"

const app = express()

// Das gehört nicht zur Library
async function fromDatabase(): Promise<object> {
  return new Promise(r => setTimeout(() => r({ hello: "world" }), 5000));
}

const fsCache = new Tresor({
  maxAge: 5000,
  resolver: new FileResolver(),
  onCacheHit: (path: string, time: number) => console.log(`Cache hit ${path} ${time}ms`),
  onCacheMiss: (path: string, time: number) => console.log(`Cache miss ${path} ${time}ms`),
})

app.get("/slow-renderer",
  fsCache.init(),
  async (req: express.Request, res: express.Response) => {
    res.$tresor(await fromDatabase());
  }
)

app.get("/query",
  (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}: ${new Date().toLocaleString()}`)
    next()
  },
  new Tresor({ resType: "html", maxAge: 5000 }).init(),
  async (req: express.Request, res: express.Response) => {
    console.log("Rendering page... I'm so slow :(")
    setTimeout(() => {
      console.log("Rendered in 5000ms");
      (<any>res.$tresor)(`Hello ${req.query.name}!`);
    }, 5000)
  }
)

app.listen(7777, () => {
  console.log("Express on port 7777")
})
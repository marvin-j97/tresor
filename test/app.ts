import express from "express"
import { Tresor, FileResolver } from "../src/index"

const app = express()

app.get("/memory/slow-html",
  new Tresor({ resType: "html", maxAge: 500 }).init(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      res.$tresor.send("Hello world!");
    }, 500)
  }
)

app.get("/memory/slow-json",
  new Tresor({ maxAge: 500 }).init(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      res.$tresor.send({ hello: "world" });
    }, 500)
  }
)

app.get("/file/slow-html",
  new Tresor({ resType: "html", maxAge: 500 }).init(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      res.$tresor.send("Hello world!");
    }, 500)
  }
)

app.get("/file/slow-json",
  new Tresor({
    maxAge: 500,
    resolver: new FileResolver("test/cache")
  }).init(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      res.$tresor.send({ hello: "world" });
    }, 500)
  }
)

export default app;
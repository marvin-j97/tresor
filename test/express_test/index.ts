import express from "express"
import { Tresor } from "../../src/index"

const app = express()

// Das gehört nicht zur Library
async function fromDatabase(): Promise<object> {
  return new Promise(r => setTimeout(() => r({ hello: "world" }), 5000));
}

app.get("/slow-renderer",
  new Tresor({ maxAge: 300000 }).middleware(),
  async (req: express.Request, res: express.Response) => {
    res.$tresor(await fromDatabase());
  }
)

app.get("/query",
  (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}: ${new Date().toLocaleString()}`)
    next()
  },
  new Tresor({ resType: "html", maxAge: 5000 }).middleware(),
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
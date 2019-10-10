import express from "express";
import { Tresor, FileAdapter } from "../../src/index";

const app = express();

async function fromDatabase(): Promise<object> {
  return new Promise(r => setTimeout(() => r({ hello: "world" }), 2500));
}

const fsCache = new Tresor({
  maxAge: "5s",
  adapter: new FileAdapter(),
  onCacheHit: (path: string, time: number) =>
    console.log(`Cache hit ${path} ${time}ms`),
  onCacheMiss: (path: string, time: number) =>
    console.log(`Cache miss ${path} ${time}ms`)
});

app.get(
  "/slow-db",
  fsCache.init(),
  async (req: express.Request, res: express.Response) => {
    res.$tresor.send(await fromDatabase());
  }
);

const htmlCache = new Tresor({
  responseType: "html",
  maxAge: "5 mins",
  maxSize: 5,
  onCacheMiss: () => console.log(`Slow render without cache`),
  onCacheHit: (path: string, time: number) =>
    console.log(`Supercharged render using cache: ${time}ms`),
  onCacheFull: () => console.log("Cache full!")
});

app.get(
  "/query",
  htmlCache.init(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      res.$tresor.send(`Hello ${req.query.name}!`);
    }, 2500);
  }
);

app.listen(7777, () => {
  console.log("Express on port 7777");
});

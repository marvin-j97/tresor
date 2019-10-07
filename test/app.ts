import express from "express";
import { Tresor, FileResolver } from "../src/index";

const app = express();

app.get(
  "/memory/slow-html",
  new Tresor({ responseType: "html", maxAge: "500ms" }).init(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      res.$tresor.send("Hello world!");
    }, 500);
  }
);

app.get(
  "/memory/slow-json",
  Tresor.json({ maxAge: "500ms" }).init(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      res.$tresor.send({ hello: "world" });
    }, 500);
  }
);

app.get(
  "/file/slow-html",
  Tresor.html({ maxAge: "500ms" }).init(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      res.$tresor.send("Hello world!");
    }, 500);
  }
);

app.get(
  "/file/slow-json",
  new Tresor({
    maxAge: "500ms",
    resolver: new FileResolver("test/cache")
  }).init(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      res.$tresor.send({ hello: "world" });
    }, 500);
  }
);

const limiter100 = Tresor.html({
  maxAge: "24 hours"
});
export { limiter100 };

app.get("/limit100", limiter100.init(), async (req, res) => {
  res.$tresor.send(
    "This route is limited to 100 cached items that last 24 hours each"
  );
});

export default app;

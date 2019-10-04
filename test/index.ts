import express from "express"
import chai, { expect } from 'chai'
import 'mocha'
import chaiHttp from "chai-http"
import { Tresor, MemoryResolver } from "../src/index"

chai.use(chaiHttp)

const app = express()

app.get("/slow-html-renderer",
  new Tresor({ resType: "html", maxAge: 1000 }).middleware(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      (<any>res.$tresor)("Hello world!");
    }, 500)
  }
)

app.get("/slow-json-renderer",
  new Tresor({ maxAge: 1000 }).middleware(),
  async (req: express.Request, res: express.Response) => {
    setTimeout(() => {
      (<any>res.$tresor)({ hello: "world" });
    }, 500)
  }
)

describe('server', () => {
  before(function () {
    app.listen(7777);
  });
})

describe('Options', () => {
  it('Options override', async () => {
    const maxAge = 60000
    const maxAmount = 500
    const manualResponse = true
    const resType = "json"

    const cache = new Tresor({
      maxAge,
      maxAmount,
      manualResponse,
      resolver: null as any,
      resType
    })

    expect(cache.options.maxAge).to.equal(maxAge)
    expect(cache.options.maxAmount).to.equal(maxAmount)
    expect(cache.options.manualResponse).to.equal(manualResponse)
    expect(cache.options.resType).to.equal(resType)
  })
})

describe('Cache', () => {

  it('Basic HTML cache', async function () {
    this.timeout(5000);

    let before = +new Date();
    let res = await chai.request(app)
      .get('/slow-html-renderer');
    let after = +new Date();

    expect(res.text).to.equal("Hello world!");
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 1 second

    // Trigger cached response 50 times
    for (let i = 0; i < 50; i++) {
      before = +new Date();
      res = await chai.request(app)
        .get('/slow-html-renderer');
      after = +new Date();

      expect(res.text).to.equal("Hello world!");
      expect(after - before).to.be.lessThan(5); // Cached response, should be less than 10ms
    }

    // Wait for cache expiration
    await new Promise(r => setTimeout(() => r(), 1500));

    before = +new Date();
    res = await chai.request(app)
      .get('/slow-html-renderer');
    after = +new Date();

    expect(res.text).to.equal("Hello world!");
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 1 second
  })

  it('Basic JSON cache', async function () {
    this.timeout(5000);

    let before = +new Date();
    let res = await chai.request(app)
      .get('/slow-json-renderer');
    let after = +new Date();

    expect(res.body).to.deep.equal({ hello: "world" });
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 1 second

    // Trigger cached response 50 times
    for (let i = 0; i < 50; i++) {
      before = +new Date();
      res = await chai.request(app)
        .get('/slow-json-renderer');
      after = +new Date();

      expect(res.body).to.deep.equal({ hello: "world" });
      expect(after - before).to.be.lessThan(5); // Cached response, should be less than 10ms
    }

    // Wait for cache expiration
    await new Promise(r => setTimeout(() => r(), 1500));

    before = +new Date();
    res = await chai.request(app)
      .get('/slow-json-renderer');
    after = +new Date();

    expect(res.body).to.deep.equal({ hello: "world" });
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 1 second
  })
})


import chai, { expect } from 'chai'
import 'mocha'
import chaiHttp from "chai-http"
import { Tresor } from "../src/index"
import app, { limiter100 } from "./app";
import { parseDuration } from "../src/time_extractor"

chai.use(chaiHttp)

describe('server', () => {
  before(function () {
    app.listen(7777);
  });
})

describe("Parse duration", () => {
  const tests = [
    ["1 ms", 1],
    ["1 sec", 1000],
    ["1 s", 1000],
    ["1s", 1000],
    ["5 secs", 5000],
    ["1mins", 60000],
    ["1 min", 60000],
    ["10 min", 600000],
    ["1.5mins", 90000],
    ["1.5 s", 1500],
    ["1 hour", 3600000],
    ["1.5hours", 5400000],
    ["1 day", 86400000],
    ["10days", 864000000],

    [47, 47],
    ["3 ms", 3],
    ["3 seconds", 3000],
    ["4 minutes", 1000 * 60 * 4],
    ["2 hours", 1000 * 60 * 60 * 2],
    ["3 days", 1000 * 60 * 60 * 24 * 3]
  ] as [string, number][]

  for (const test of tests) {
    it(`Should equal ${test[1]}`, () => {
      expect(parseDuration(test[0])).to.equal(test[1])
    })
  }
})

describe('Options', () => {
  it('Options override', async () => {
    const maxAge = 60000
    const maxAmount = 500
    const manualResponse = true
    const responseType = "json"

    const cache = new Tresor({
      maxAge,
      maxAmount,
      manualResponse,
      resolver: null as any,
      responseType
    })

    expect(cache.options.maxAge).to.equal(maxAge)
    expect(cache.options.maxAmount).to.equal(maxAmount)
    expect(cache.options.manualResponse).to.equal(manualResponse)
    expect(cache.options.responseType).to.equal(responseType)
  })
})

describe('In-Memory Cache', () => {
  it('Basic HTML cache', async function () {
    this.timeout(5000);

    let before = +new Date();
    let res = await chai.request(app)
      .get('/memory/slow-html');
    let after = +new Date();

    expect(res.text).to.equal("Hello world!");
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 500 ms

    // Trigger cached response 50 times
    for (let i = 0; i < 50; i++) {
      before = +new Date();
      res = await chai.request(app)
        .get('/memory/slow-html');
      after = +new Date();

      expect(res.text).to.equal("Hello world!");
      expect(after - before).to.be.lessThan(10); // Cached response, should be less than 10ms
    }

    // Wait for cache expiration
    await new Promise(r => setTimeout(() => r(), 600));

    before = +new Date();
    res = await chai.request(app)
      .get('/memory/slow-html');
    after = +new Date();

    expect(res.text).to.equal("Hello world!");
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 500 ms
  })

  it('Basic JSON cache', async function () {
    this.timeout(5000);

    let before = +new Date();
    let res = await chai.request(app)
      .get('/memory/slow-json');
    let after = +new Date();

    expect(res.body).to.deep.equal({ hello: "world" });
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 500 ms

    // Trigger cached response 50 times
    for (let i = 0; i < 50; i++) {
      before = +new Date();
      res = await chai.request(app)
        .get('/memory/slow-json');
      after = +new Date();

      expect(res.body).to.deep.equal({ hello: "world" });
      expect(after - before).to.be.lessThan(10); // Cached response, should be less than 10ms
    }

    // Wait for cache expiration
    await new Promise(r => setTimeout(() => r(), 600));

    before = +new Date();
    res = await chai.request(app)
      .get('/memory/slow-json');
    after = +new Date();

    expect(res.body).to.deep.equal({ hello: "world" });
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 500 ms
  })
})

describe('File Cache', () => {
  it('Basic HTML cache', async function () {
    this.timeout(5000);

    let before = +new Date();
    let res = await chai.request(app)
      .get('/file/slow-html');
    let after = +new Date();

    expect(res.text).to.equal("Hello world!");
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 500 ms

    // Trigger cached response 50 times
    for (let i = 0; i < 50; i++) {
      before = +new Date();
      res = await chai.request(app)
        .get('/file/slow-html');
      after = +new Date();

      expect(res.text).to.equal("Hello world!");
      expect(after - before).to.be.lessThan(10); // Cached response, should be less than 10ms
    }

    // Wait for cache expiration
    await new Promise(r => setTimeout(() => r(), 600));

    before = +new Date();
    res = await chai.request(app)
      .get('/file/slow-html');
    after = +new Date();

    expect(res.text).to.equal("Hello world!");
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 500 ms
  })

  it('Basic JSON cache', async function () {
    this.timeout(5000);

    let before = +new Date();
    let res = await chai.request(app)
      .get('/file/slow-json');
    let after = +new Date();

    expect(res.body).to.deep.equal({ hello: "world" });
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 500 ms

    // Trigger cached response 50 times
    for (let i = 0; i < 50; i++) {
      before = +new Date();
      res = await chai.request(app)
        .get('/file/slow-json');
      after = +new Date();

      expect(res.body).to.deep.equal({ hello: "world" });
      expect(after - before).to.be.lessThan(10); // Cached response, should be less than 10ms
    }

    // Wait for cache expiration
    await new Promise(r => setTimeout(() => r(), 600));

    before = +new Date();
    res = await chai.request(app)
      .get('/file/slow-json');
    after = +new Date();

    expect(res.body).to.deep.equal({ hello: "world" });
    expect(after - before).to.be.greaterThan(400); // Rendered page: should take 500 ms
  })
})

describe("Limit test", () => {
  it("Should never go above 100 items", async function () {
    this.timeout(5000);

    for (let i = 0; i < 1000; i++) {
      await chai.request(app)
        .get(`/limit100?q=${i}`);

      expect(limiter100.options.resolver.size()).to.be.lessThan(101)
    }
  })
})
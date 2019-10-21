import { expect } from "chai";
import "mocha";
import { Tresor } from "../src/index";
import { parseDuration } from "../src/time_extractor";

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
    ["2h", 1000 * 60 * 60 * 2],
    ["3 days", 1000 * 60 * 60 * 24 * 3]
  ] as [string | number, number][];

  for (const test of tests) {
    it(`Should equal ${test[1]}`, () => {
      expect(parseDuration(test[0])).to.equal(test[1]);
    });
  }
});

describe("Options", () => {
  it("Options override", async () => {
    const maxAge = 60000;
    const maxSize = 500;

    const cache = new Tresor({
      maxAge,
      maxSize,
      adapter: null as any
    });

    expect(cache.options.maxAge).to.equal(maxAge);
    expect(cache.options.maxSize).to.equal(maxSize);
  });
});

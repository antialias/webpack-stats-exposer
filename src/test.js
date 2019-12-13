import Koa from "koa";
import request from "supertest";
import { getBundlePaths, buildExposeBundlePathsKoaMiddleware } from "./main";

jest.mock("fs", () => {
  const mockFiles = {
    "single-value-assets": JSON.stringify({
      assetsByChunkName: {
        main: "abc.js"
      }
    }),
    "some-paths-dont-end-in-js": JSON.stringify({
      assetsByChunkName: {
        main: ["xyz.789", "abc.js", "zxc.js", "qwe.456"]
      }
    }),
    "array-with-single-value": JSON.stringify({
      assetsByChunkName: {
        main: ["abc.js"]
      }
    })
  };
  return {
    readFileSync: path => {
      if (mockFiles[path]) {
        return mockFiles[path];
      }
      throw `${path} not found`;
    }
  };
});
describe("build expose asset paths koa middleware", () => {
  let app;
  let server;
  beforeEach(() => {
    app = new Koa();
  });
  it("should default to ctx.state.webpackStats", async () => {
    app.use((ctx, next) => {
      ctx.state.webpackStats = {
        toJson: () => ctx.state.webpackStats,
        assetsByChunkName: { main: ["bar.js", "fix.js"] }
      };
      return next();
    });
    app.use(
      buildExposeBundlePathsKoaMiddleware({ defaultBundlePaths: ["built.js"] })
    );
    app.use(ctx => {
      ctx.body = ctx.bundlePaths.join(":");
    });
    server = app.listen();
    const response = await request(server)
      .get("/")
      .expect(200);
    expect(response.text).toMatchInlineSnapshot(`"bar.js:fix.js"`);
  });
  it("should use the stats file when ctx.state.webpackStats is not present", async () => {
    app.use(
      buildExposeBundlePathsKoaMiddleware({
        defaultBundlePaths: ["it.js", "was", "built.php"]
      })
    );
    app.use(ctx => {
      ctx.body = ctx.bundlePaths.join(":");
    });
    server = app.listen();
    const response = await request(server)
      .get("/")
      .expect(200);
    expect(response.text).toMatchInlineSnapshot(`"it.js:was:built.php"`);
  });
  afterEach(() => {
    server?.close();
  });
});

describe("get bundle paths", () => {
  it("filters out paths that don't end in suffix", () => {
    expect(
      getBundlePaths({
        statsFilePath: "some-paths-dont-end-in-js"
      })
    ).toEqual(["abc.js", "zxc.js"]);
  });

  it("works on single values", () => {
    expect(
      getBundlePaths({
        statsFilePath: "single-value-assets"
      })
    ).toEqual(["abc.js"]);
  });

  it("works on arrays with a single value", () => {
    expect(
      getBundlePaths({
        statsFilePath: "array-with-single-value"
      })
    ).toEqual(["abc.js"]);
  });

  it("does not fail when stats object is missing", () => {
    getBundlePaths({ statsFilePath: "nothing-here" });
  });
  it("does not fail when statsFilePath is not passed", () => {
    getBundlePaths({});
  });
});

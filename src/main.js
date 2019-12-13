import { get } from "object-path";
import fs from "fs";

const alwaysArray = thing =>
  thing ? (Array.isArray(thing) ? thing : [thing]) : [];

const pathToMainChunks = "assetsByChunkName.main";
const getChunkPaths = ({ stats, suffix }) =>
  alwaysArray(get(stats, pathToMainChunks))?.filter(path =>
    path.endsWith(`.${suffix}`)
  );

// exposes js bundle file paths on ctx.jsPaths
export const buildExposeBundlePathsKoaMiddleware = ({
  defaultBundlePaths,
  ctxPropertyName = "bundlePaths"
}) => async (ctx, next) => {
  // ctx.stats.webpackStats is set by koa-webpack
  // see https://github.com/shellscape/koa-webpack#server-side-rendering
  if (ctx.state?.webpackStats) {
    ctx[ctxPropertyName] = getChunkPaths({
      stats: ctx.state.webpackStats.toJson(),
      suffix: "js"
    });
  } else if (defaultBundlePaths) {
    ctx[ctxPropertyName] = defaultBundlePaths;
  } else {
    throw new Error(
      "could not find stats object that describes client-side bundles"
    );
  }
  await next();
};
export const getBundlePaths = ({ statsFilePath }) => {
  let webpackStatsFile;
  try {
    webpackStatsFile = fs.readFileSync(statsFilePath);
  } catch (e) {
    return null;
  }
  const stats = JSON.parse(webpackStatsFile);
  return getChunkPaths({ stats, suffix: "js" });
};

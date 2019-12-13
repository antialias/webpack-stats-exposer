# webpack stats exposer

expose the right webpack bundle paths to koa.

## exports
* `getBundlePaths`
  * `({statsFilePath}) => [::string]`
  * finds the paths to javascript files by inspecting a webpack stats file: 
* `buildExposeBundlePathsKoaMiddleware`
  * `({defaultBundlePaths, ctxPropertyName}) => (ctx, next) => ::Promise`
  * middleware builder that exposes the js paths on `ctx`. The script paths are extracted from `ctx.state.webpackStats` if it is set, whichis useful for automatically using the script paths in conjunction with webpack-dev-middleware.

## usage

build script:
```sh
webpack --profile --json > webpack-stats.json
```

koa server definition:
```js
import Koa from 'koa';
import {
  getScriptPaths,
  buildExposeAssetPathsKoaMiddleware,
} from 'webpack-stats-explorer';
const builtBundlePaths = getScriptPaths({statsFilePath: 'webpack-stats.json'})
const app = new Koa();
if (process.env.NODE_ENV !== 'production') {
  app.use(koaWebpack({compiler})) // compiler is an instance of webpack(config)
}
app.use(buildExposeAssetPathsKoaMiddleware({
  defaultBundlePaths: builtBundlePaths,
  ctxPropertyName: 'jsPaths'
});
app.use(ctx => {
  ctx.body = `
    <!doctype HTML>
    <html>
      <head>
        <title>hello world</title>
      </head>
      <body>
      ${ctx.bundlePaths
        .map(bundlePath => `<script type='application/json' src='${bundlePath}' ></script>`)
        .join('\n')
      }
      </body>
    </html>
  `;
})
```
In the example app above, `ctx.bundlePaths` will be set to the paths in the stats object at `ctx.state.webpackStats` when present (i.e. when `NODE_ENV !== production and `koaWebpack` is used`), otherwise the bundle paths will be found in  webpack-stats.json`.
So, when koa-webpack is used, the bundles that it produces will be exposed on the page, otherwise, the bundles built by the build script will be used.

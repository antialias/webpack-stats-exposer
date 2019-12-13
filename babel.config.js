/* global module */
module.exports = {
  "presets": [
    [
      "@babel/preset-env", {
        "targets": {
          node: "10",
        },
      },
    ],
  ],
  plugins:[
    "@babel/plugin-proposal-optional-chaining", 
  ],
  env: {
    test: {
      plugins: ["@babel/plugin-transform-runtime"],
    },
  },
}


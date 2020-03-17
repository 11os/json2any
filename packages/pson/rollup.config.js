import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";

export default [
  // browser-friendly UMD build
  {
    input: "src/main.ts",
    output: [
      {
        name: "json",
        file: "dist/json.js",
        format: "umd"
      }
    ],
    plugins: [
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
      typescript()
    ]
  }
];

const args = require("minimist")(process.argv.slice(2)); //node scripts/dev.js reactivity -f global
const { resolve } = require("path");
// minimist 用来解析命令行参数
console.log("--->", args); //---> { _: [ 'reactivity' ], f: 'global' }
const { build } = require("esbuild");

const target = args._[0] || "reactivity";
const format = args.f || "global";

const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));

// iife 立即执行函数
// cjs node中的模块
// esm 浏览器中的esModule模块
const outputFormat = format.startsWith("global")
  ? "iife"
  : format === "cjs"
  ? "cjs"
  : "esm";

// 输出文件目录
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`,
);

// esbuild
// 天生支持ts
build({
  entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
  outfile,
  bundle: true, // 把所有的包全部打包到一起
  sourcemap: true,
  format: outputFormat, // 输出格式
  globalName: pkg.buildOptions.name, // 打包的全局的名字
  platform: format === "cjs" ? "node" : "browser", // 平台
  watch: {
    // 监控文件变化
    onRebuild(error) {
      if (!error) {
        console.log("rebuild~~~~");
      }
    },
  },
}).then(() => {
  console.log("watching~~~~~");
});

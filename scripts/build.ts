import { copyFile, readFile, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";

const __dirname = (() => {
  const x = dirname(decodeURI(new URL(import.meta.url).pathname));
  return resolve(process.platform == "win32" ? x.substring(1) : x);
})();

const source = await readFile(join(__dirname, "../../package.json"), "utf-8");
const object = JSON.parse(source);
object.scripts = {};
object.devDependencies = {};
await writeFile(
  join(__dirname, "../../dist/package.json"),
  Buffer.from(JSON.stringify(object, null, 2), "utf-8")
);

await copyFile(
  join(__dirname, "../../README.md"),
  join(__dirname, "../../dist/README.md")
);

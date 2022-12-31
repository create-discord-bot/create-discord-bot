import { copyFile, readFile, writeFile } from "fs/promises";

const source = await readFile("./package.json", "utf-8");
const object = JSON.parse(source);
object.scripts = {};
object.devDependencies = {};
await writeFile(
  join(__dirname, "./dist/package.json"),
  Buffer.from(JSON.stringify(object), "utf-8")
);

await copyFile(
  join(__dirname, "./README.md"),
  join(__dirname, "./dist/README.md")
);

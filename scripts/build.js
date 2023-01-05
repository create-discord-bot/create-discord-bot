import { copyFile, readFile, writeFile } from "fs/promises";

const source = await readFile("./package.json", "utf-8");
const object = JSON.parse(source);
delete object.scripts;
delete object.devDependencies;

await writeFile(
  "./dist/package.json",
  Buffer.from(JSON.stringify(object), "utf-8")
);

await copyFile("./README.md", "./dist/README.md");

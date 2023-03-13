//@ts-check

import { it } from "node:test";
import { sync } from "cross-spawn";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";

const directory = `test_case-${randomBytes(4).toString("hex")}`;

const options = [
  "--e=false",
  "--p=true",
  "--l=typescript",
  "--o=pino",
  "--m=global,guild",
  `--d=${directory}`,
  "--g=no",
];

const filesShouldExist = [
  "package.json",
  ".gitignore",
  ".env",
  "src/index",
  "src/commands/ping.ts",
  "src/events/interactionCreate.ts",
  "src/events/ready.ts",
  "src/global.ts",
  "src/guild.ts",
  ".prettierignore",
  ".prettierrc.json",
];

const filesShouldntExist = [".eslintignore", ".eslintrc.json"];

sync("npx", ["tsx", "src/index.ts", "--", ...options]);

process.chdir(directory);
filesShouldExist.forEach((value) => {
  it(`${value} should exist`, () => {
    existsSync(value);
  });
});
filesShouldntExist.forEach((value) => {
  it(`${value} shouldn't exist`, () => {
    existsSync(value);
  });
});
process.chdir("..");

await rm(directory, { recursive: true, force: true });

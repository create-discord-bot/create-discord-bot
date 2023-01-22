import { it } from "node:test";
import { execa } from "execa";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";

const directory = `test_case-${randomBytes(4).toString("hex")}`;

const options = [
  "--e=true",
  "--p=true",
  "--l=typescript",
  "--lo=pino",
  "--de=global,guild",
  `--d=${directory}`,
  "--pm=no",
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
  ".eslintignore",
  ".eslintrc.json",
  ".prettierignore",
  ".prettierrc.json",
];

await execa("npx", ["tsx", "src/index.ts", "--", ...options]);

process.chdir(directory);
filesShouldExist.forEach((value) => {
  it(`${value} should exist`, () => {
    existsSync(value);
  });
});
process.chdir("..");

await rm(directory, { recursive: true, force: true });

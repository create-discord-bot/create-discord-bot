#! /usr/bin/env node

import prompts, { Falsy, PromptType } from "prompts";
import larser from "larser";
import Spinner from "kisig";
import { readFile, writeFile } from "fs/promises";
import { execSync } from "child_process";
import { createWriteStream, existsSync } from "fs";
import { mkdir } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import StreamZip from "node-stream-zip";
import "node-fetch-native/polyfill";

const streamPipeline = promisify(pipeline);

const base = `https://github.com/create-discord-bot/create-discord-bot/tree/main/templates`;
const tarZipLocation = `${join(
  homedir(),
  ".cache/create-discord-bot/main.zip"
)}`;
const tarLink = `${base.replace(/\/tree.*$/gm, "")}/archive/main.zip`;

const downloadTemplate = async (subfolder: string, dir: string) => {
  if (!existsSync(tarZipLocation)) {
    // @ts-expect-error: res.body is valid but ts is weird so.
    // prettier-ignore
    await streamPipeline((await fetch(tarLink)).body, createWriteStream(tarZipLocation));
  }
  if (!existsSync(dir)) {
    mkdir(dir, { recursive: true });
  }

  const zip = new StreamZip.async({ file: tarZipLocation });
  await zip.extract(`create-discord-bot-main/templates/${subfolder}`, dir);
  await zip.close();
};

console.clear();
console.log("\x1b[1;34mcreate-discord-bot\x1b[0m");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const args: { _: string[]; [key: string]: any } = larser(process.argv, {
  aliases: {
    eslint: ["e"],
    prettier: ["p"],
    language: ["l"],
    logger: ["o"],
    directory: ["d"],
    deployment: ["m"],
    packageManager: ["g"],
  },
});

let directoryPath = args.d?.replace(/\/$/, "");
let deployment: string[] = args.m?.split(",");
let eslint = args.e ? JSON.parse(args.e) : true;
let prettier = args.p ? JSON.parse(args.p) : true;

process.on("SIGINT", () => process.exit(0));
const answers = await prompts(
  [
    {
      message: "Where would you like to create the discord bot ?",
      type: args.d ? (false as Falsy) : ("text" as PromptType),
      name: "d",
      initial: "./",
      format: (value: string) => {
        return value.replace(/\/$/, "");
      },
    },
    {
      message: "What language do you want to use ?",
      name: "l",
      type: args.l ? (false as Falsy) : ("select" as PromptType),
      choices: [
        { title: "Typescript", value: "typescript" },
        { title: "Javascript", value: "javascript" },
      ],
      initial: 0,
    },
    {
      message: "What type of logging do you want to use ?",
      name: "o",
      type: args.o ? (false as Falsy) : ("select" as PromptType),
      choices: [
        { title: "Default", value: "default" },
        { title: "Pino", value: "pino" },
      ],
    },
    {
      message: "What deployment method(s) do you want to use ?",
      name: "m",
      type: args.m ? (false as Falsy) : ("multiselect" as PromptType),
      choices: [
        {
          title: "Global",
          selected: true,
          value: "global",
        },
        {
          title: "Guild",
          value: "guild",
        },
      ],
      instructions: false,
      max: 2,
      hint: "- Space to select. Enter to submit",
    },
    {
      message: "Do you want to enable Prettier ?",
      type: args.p ? (false as Falsy) : ("toggle" as PromptType),
      name: "p",
      initial: true,
      active: "yes",
      inactive: "no",
    },
    {
      message: "Do you want to enable ESLint ?",
      type: args.e ? (false as Falsy) : ("toggle" as PromptType),
      name: "e",
      initial: true,
      active: "yes",
      inactive: "no",
    },
  ],
  {
    onCancel: () => process.exit(0),
  }
);

if (answers.d) directoryPath = answers.d;
if (answers.l) args.l = answers.l;
if (answers.o) args.o = answers.o;
if (answers.m) deployment = answers.m;
if (answers.e) eslint = answers.e;
if (answers.p) prettier = answers.p;

console.clear();
const spinner = new Spinner("Setting up your project...");

try {
  await Promise.all([
    downloadTemplate(`${args.l}/${args.o}`, directoryPath),
    deployment.map((value) =>
      downloadTemplate(`${args.l}/${args.o}/${value}`, `${directoryPath}/src/`)
    ),
    eslint
      ? downloadTemplate(`eslint/${args.l}`, directoryPath)
      : Promise.resolve(),
    prettier ? downloadTemplate(`prettier`, directoryPath) : Promise.resolve(),
  ]);

  const data = await readFile(`${directoryPath}/package.json`, "utf-8");

  const object = JSON.parse(data);

  for (let i = 0; i < deployment.length; i++) {
    object["scripts"][`deploy:${deployment[i]}`] = `${
      args.l === "typescript" ? "npx tsx" : "node"
    } src/${deployment[i]}.${args.l === "typescript" ? "ts" : "js"}`;
  }

  if (eslint) {
    if (args.l === "typescript") {
      object["devDependencies"] = {
        ...object["devDependencies"],
        "@typescript-eslint/eslint-plugin": "^5.54.1",
        "@typescript-eslint/parser": "^5.54.1",
      };
    }
    object["devDependencies"]["eslint"] = "^8.35.0";
  }

  if (prettier) {
    if (eslint) {
      const data = await readFile(`${directoryPath}/.eslintrc.json`, "utf-8");

      const object = JSON.parse(data);

      object["extends"].push("prettier");

      await writeFile(
        `${directoryPath}/.eslintrc.json`,
        JSON.stringify(object, null, "\t")
      );
    }
    object["devDependencies"]["prettier"] = "^2.8.4";
  }

  await Promise.all([
    writeFile(
      `${directoryPath}/package.json`,
      JSON.stringify(object, null, "\t")
    ),
    writeFile(
      `${directoryPath}/.env`,
      'DISCORD_TOKEN="YOUR TOKEN HERE"\nCLIENT_ID="YOUR CLIENT ID HERE"\nGUILD_ID="YOUR GUILD ID HERE"'
    ),
  ]);

  spinner.success("Finished creating your project files!");
} catch (error) {
  spinner.error(`An error has occured: \x1b[31m${error}\x1b[0m`);
  process.exit(1);
}

console.clear();
const toLog = [
  "\x1b[1;34mNext steps:\x1b[0m",
  `\n· cd ${directoryPath} \x1b[90m(Puts your terminal into the folder)\x1b[0m`,
  "",
  "\n· Fill out .env file",
  "\n· npm start \x1b[90m(Starts the bot)\x1b[0m",
];

const answer = await prompts(
  {
    message: "Would you like to install dependencies now ?",
    type: args.g ? (false as Falsy) : "select",
    name: "v",
    choices: [
      { title: "npm", value: "npm" },
      { title: "yarn", value: "yarn" },
      { title: "pnpm", value: "pnpm" },
      { title: "No", value: "n" },
    ],
  },
  {
    onCancel: () => process.exit(0),
  }
);

args.g = answer.v;

if (args.g !== "n") {
  execSync(`cd ${directoryPath} && ${args.g} install`, {
    stdio: [0, 1, 2],
  });
} else {
  toLog[2] =
    "\n\x1b[37m· npm install\x1b[0m \x1b[90m(Installs all dependencies required)\x1b[0m";
}

console.log(...toLog);

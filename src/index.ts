#! /usr/bin/env node

import prompts, { Falsy, PromptType } from "prompts";
import larser from "larser";
import { downloadTemplate } from "giget";
import Spinner from "kisig";
import { readFile, writeFile } from "fs/promises";
import { execSync } from "child_process";

console.clear();
console.log("\x1b[1;34mcreate-discord-bot\x1b[0m");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const args: { _: string[]; [key: string]: any } = larser(process.argv, {
  aliases: {
    eslint: ["esl", "es", "e"],
    prettier: ["prt", "pr", "p"],
    language: ["lang", "l"],
    logger: ["log", "lo"],
    directory: ["dir", "d"],
    deployment: ["de", "deploy", "dep", "deployments"],
    packageManager: ["pmg", "pm"],
  },
});

let directoryPath = args.d?.replace(/\/$/, "");
let deployment: string[] = args.de?.split(",");
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
      type: args.lo ? (false as Falsy) : ("select" as PromptType),
      choices: [
        { title: "Default", value: "default" },
        { title: "Pino", value: "pino" },
      ],
    },
    {
      message: "What deployment method(s) do you want to use ?",
      name: "q",
      type: args.de ? (false as Falsy) : ("multiselect" as PromptType),
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
if (answers.o) args.lo = answers.o;
if (answers.q) deployment = answers.q;
if (answers.e) eslint = answers.e;
if (answers.p) prettier = answers.p;

console.clear();
const spinner = new Spinner("Setting up your project...");

try {
  const base = `github:flzyy/create-discord-bot/templates/`;

  await Promise.all([
    downloadTemplate(`${base}${args.l}/${args.lo}`, {
      dir: directoryPath,
      force: true,
    }),
    deployment.map((value) =>
      downloadTemplate(`${base}${args.l}/${args.lo}/${value}`, {
        dir: `${directoryPath}/src/`,
        force: true,
      })
    ),
    eslint
      ? downloadTemplate(`${base}eslint/${args.l}`, {
          dir: directoryPath,
          force: true,
        })
      : Promise.resolve(),
    prettier
      ? downloadTemplate(`${base}prettier`, {
          dir: directoryPath,
          force: true,
        })
      : Promise.resolve(),
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
        "@typescript-eslint/eslint-plugin": "^5.49.0",
        "@typescript-eslint/parser": "^5.49.0",
      };
    }
    object["devDependencies"]["eslint"] = "^8.33.0";
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
    object["devDependencies"]["prettier"] = "^2.8.3";
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

if (!args.pm) {
  const answer = await prompts(
    {
      message: "Would you like to install dependencies now ?",
      type: "select",
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

  args.pm = answer.v;
}

if (args.pm !== "n") {
  execSync(`cd ${directoryPath} && ${args.pm} install`, {
    stdio: [0, 1, 2],
  });
} else {
  toLog[2] =
    "\n\x1b[37m· npm install\x1b[0m \x1b[90m(Installs all dependencies required)\x1b[0m";
}

console.clear();
console.log(...toLog);

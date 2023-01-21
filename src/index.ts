#! /usr/bin/env node

import prompts, { Falsy, PromptType } from "prompts";
import larser from "larser";
import { downloadTemplate } from "giget";
import { createSpinner } from "nanospinner";
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
const spinner = createSpinner("Setting up your project...");
spinner.start();
try {
  await downloadTemplate(
    `github:flzyy/create-discord-bot/templates/${args.l}/${args.lo}`,
    {
      dir: directoryPath,
      force: true,
    }
  );

  for (let i = 0; i < deployment.length; i++) {
    await downloadTemplate(
      `github:flzyy/create-discord-bot/templates/deploy/${args.l}/${args.lo}/${deployment[i]}`,
      {
        dir: `${directoryPath}/src/`,
        force: true,
      }
    );
  }

  const data = await readFile(`${directoryPath}/package.json`, "utf-8");

  if (data) {
    const object = JSON.parse(data);

    for (let i = 0; i < deployment.length; i++) {
      object["scripts"][`deploy:${deployment[i]}`] = `${
        args.l === "typescript" ? "npx tsx" : "node"
      } src/${deployment[i]}.${args.l === "typescript" ? "ts" : "js"}`;
    }

    if (eslint) {
      await downloadTemplate(
        `github:flzyy/create-discord-bot/templates/eslint/${args.l}`,
        {
          dir: directoryPath,
          force: true,
        }
      );

      if (args.l === "typescript") {
        object["devDependencies"] = {
          ...object["devDependencies"],
          "@typescript-eslint/eslint-plugin": "^5.48.2",
          "@typescript-eslint/parser": "^5.48.2",
        };
      }
      object["devDependencies"]["eslint"] = "^8.32.0";
    }

    if (prettier) {
      await downloadTemplate(
        "github:flzyy/create-discord-bot/templates/prettier",
        {
          dir: directoryPath,
          force: true,
        }
      );

      if (eslint) {
        const data = await readFile(`${directoryPath}/.eslintrc.json`, "utf-8");

        if (data) {
          const object = JSON.parse(data);

          object["extends"].push("prettier");

          await writeFile(
            `${directoryPath}/.eslintrc.json`,
            JSON.stringify(object, null, "\t")
          );
        }
      }
      object["devDependencies"]["prettier"] = "^2.8.3";
    }

    await writeFile(
      `${directoryPath}/package.json`,
      JSON.stringify(object, null, "\t")
    );
  }

  await writeFile(
    `${directoryPath}/.env`,
    'DISCORD_TOKEN="YOUR TOKEN HERE"\nCLIENT_ID="YOUR CLIENT ID HERE"\nGUILD_ID="YOUR GUILD ID HERE"'
  );

  spinner.success({ text: "Finished creating your project files!" });
} catch (error) {
  spinner.error({
    text: `\x1b[90m An error has occured: ${`\x1b[31m${error}\x1b[0m`}`,
  });
  process.exit(1);
}

console.clear();
const toLog = [
  "\x1b[1;34mNext steps:\x1b[0m",
  `\n\x1b[37m· cd ${directoryPath}\x1b[0m \x1b[90m(Puts your terminal into the folder)\x1b[0m`,
  "",
  "\n\x1b[37m· Fill out .env file\x1b[0m",
  "\n\x1b[37m· npm start\x1b[0m \x1b[90m(Starts the bot)\x1b[0m",
];

if (!args.pm) {
  const answer = await prompts(
    {
      message: "Would you like to install dependencies now ?",
      type: "select",
      name: "value",
      choices: [
        { title: "npm", value: "npm" },
        { title: "yarn", value: "yarn" },
        { title: "pnpm", value: "pnpm" },
        { title: "No", value: "no" },
      ],
    },
    {
      onCancel: () => process.exit(0),
    }
  );

  args.pm = answer.value;
}

if (args.pm !== "no") {
  execSync(`cd ${directoryPath} && ${args.pm} install`, {
    stdio: [0, 1, 2],
  });
} else {
  toLog[2] =
    "\n\x1b[37m· npm install\x1b[0m \x1b[90m(Installs all dependencies required)\x1b[0m";
}

console.clear();
console.log(...toLog);

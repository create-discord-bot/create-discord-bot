#! /usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */

import prompts from "prompts";
import mri from "mri";
import { downloadTemplate } from "giget";
import { createSpinner } from "nanospinner";
import { readFile, writeFile } from "fs/promises";
import { execSync } from "child_process";

console.clear();
console.log("\x1b[1m\x1b[34mcreate-discord-bot\x1b[0m");

const argv = process.argv.slice(2);
let directoryPath = "";
let language: "typescript" | "javascript" = "typescript";
let logger: "default" | "pino" = "pino";
let deployment: string[] = [];
let eslint = true;
let prettier = true;
let packageManager: string | null = "npm";

const args = mri(argv, {
  alias: {
    eslint: ["esl", "es", "e"],
    prettier: ["prt", "pr", "p"],
    language: ["lang", "l"],
    logger: ["log", "lo"],
    directory: ["dir", "d"],
    deployment: ["de", "deploy", "dep", "deployments"],
    packageManager: ["pmg", "pm"],
  },
});

const questions: any = [
  {
    message: "Where would you like to create the discord bot ?",
    type: "text",
    name: "directoryPath",
    initial: "./",
    format: (value: string) => {
      if (value.endsWith("/") || value.endsWith("\\")) {
        return value.slice(0, -1);
      }
      return value;
    },
  },
  {
    message: "What language do you want to use ?",
    name: "language",
    type: "select",
    choices: [
      { title: "Typescript", value: "typescript" },
      { title: "Javascript", value: "javascript" },
    ],
    initial: 0,
  },
  {
    message: "What type of logging do you want to use ?",
    name: "logger",
    type: "select",
    choices: [
      { title: "Default", value: "default" },
      { title: "Pino", value: "pino" },
    ],
  },
  {
    message: "What deployment method(s) do you want to use ?",
    name: "deployment",
    type: "multiselect",
    choices: [
      {
        title: "Global",
        selected: true,
        value: "registergl",
      },
      {
        title: "Guild",
        value: "registergu",
      },
    ],
    instructions: false,
    max: 2,
    hint: "- Space to select. Enter to submit",
  },
  {
    message: "Do you want to enable Prettier ?",
    type: "toggle",
    name: "prettier",
    initial: true,
    active: "yes",
    inactive: "no",
  },
  {
    message: "Do you want to enable ESLint ?",
    type: "toggle",
    name: "eslint",
    initial: true,
    active: "yes",
    inactive: "no",
  },
];

if (args.directory) {
  (questions[0].type as string | null) = null;
  if (args.directory.endsWith("/") || args.directory.endsWith("\\")) {
    directoryPath = args.directory.slice(0, -1);
  }
  directoryPath = args.directory;
}

if (args.language) {
  (questions[1].type as string | null) = null;
  language = args.language.toLowerCase();
}

if (args.logger) {
  (questions[2].type as string | null) = null;
  logger = args.logger.toLowerCase();
}

if (args.deployment) {
  (questions[3].type as string | null) = null;
  if (args.deployment.includes(",")) {
    deployment = args.deployment.split(",");
  } else {
    deployment = [args.deployment];
  }
}

if (args.prettier) {
  (questions[4].type as string | null) = null;
  prettier = JSON.parse(args.prettier);
}

if (args.eslint) {
  (questions[5].type as string | null) = null;
  eslint = JSON.parse(args.eslint);
}

if (args.packageManager) {
  packageManager = args.packageManager;
} else {
  packageManager = null;
}

const answers = await prompts(questions);

try {
  if (answers.directoryPath) {
    directoryPath = answers.directoryPath;
  }
  if (answers.language) {
    language = answers.language;
  }
  if (answers.logger) {
    logger = answers.logger;
  }
  if (answers.deployment) {
    deployment = answers.deployment;
  }
  if (answers.eslint) {
    eslint = answers.eslint;
  }
  if (answers.prettier) {
    prettier = answers.prettier;
  }

  console.clear();
  const spinner = createSpinner("Setting up your project...");
  spinner.start();
  try {
    await downloadTemplate(
      `github:flzyy/create-discord-bot/templates/${language}/${logger}`,
      {
        dir: directoryPath,
        force: true,
      }
    );

    const length = deployment.length;
    for (let i = 0; i < length; i++) {
      await downloadTemplate(
        `github:flzyy/create-discord-bot/templates/deploy/${language}/${logger}/${deployment[i]}`,
        {
          dir: `${directoryPath}/src/`,
          force: true,
        }
      );
    }

    const data = await readFile(`${directoryPath}/package.json`);

    if (data) {
      const object = JSON.parse(data.toString());
      let prestart = "";

      for (let i = 0; i < length; i++) {
        object["scripts"][deployment[i]] = `${
          language === "typescript" ? "npx tsx" : "node"
        } src/${deployment[i]}.${language === "typescript" ? "ts" : "js"}`;
      }

      if (
        deployment.includes("registergu") &&
        deployment.includes("registergl")
      ) {
        prestart += "npm run registergu && npm run registergl";
      } else if (deployment.includes("registergu")) {
        prestart += "npm run registergu";
      } else if (deployment.includes("registergul")) {
        prestart += "npm run registergl";
      }

      if (logger === "pino") {
        prestart += "| npx pino-pretty";
      }

      object["scripts"]["prestart"] = prestart;

      if (eslint === true) {
        await downloadTemplate(
          `github:flzyy/create-discord-bot/templates/eslint/${language}`,
          {
            dir: directoryPath,
            force: true,
          }
        );

        if (language === "typescript") {
          object["devDependencies"]["@typescript-eslint/eslint-plugin"] =
            "^5.46.1";
          object["devDependencies"]["@typescript-eslint/parser"] = "^5.46.1";
          object["devDependencies"]["eslint"] = "^8.29.0";
        } else {
          object["devDependencies"]["eslint"] = "^8.29.0";
        }
      }

      if (prettier === true) {
        await downloadTemplate(
          "github:flzyy/create-discord-bot/templates/prettier",
          {
            dir: directoryPath,
            force: true,
          }
        );

        if (eslint === true) {
          const data = await readFile(`${directoryPath}/.eslintrc.json`);

          if (data) {
            const object = JSON.parse(data.toString());

            object["extends"].push("prettier");

            await writeFile(
              `${directoryPath}/.eslintrc.json`,
              JSON.stringify(object, null, "\t")
            );
          }
        }
        object["devDependencies"]["prettier"] = "^2.8.1";
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
  }
  console.clear();
  const toLog = [
    "\x1b[1m\x1b[34mNext steps:\x1b[0m",
    `\n\x1b[37m· cd ${directoryPath}\x1b[0m \x1b[90m(Puts your terminal into the folder)\x1b[0m`,
    "",
    "\n\x1b[37m· Fill out .env file\x1b[0m",
    "\n\x1b[37m· npm start\x1b[0m \x1b[90m(Starts the bot)\x1b[0m",
  ];

  if (packageManager === null) {
    const answer = await prompts({
      message: "Would you like to install dependencies now ?",
      type: "select",
      name: "value",
      choices: [
        { title: "npm", value: "npm" },
        { title: "yarn", value: "yarn" },
        { title: "pnpm", value: "pnpm" },
        { title: "No", value: "no" },
      ],
    });

    packageManager = answer.value;
  }

  if (packageManager !== "no") {
    execSync(`${packageManager} install --prefix .\\${directoryPath}`, {
      stdio: [0, 1, 2],
    });
  } else {
    toLog[2] =
      "\n\x1b[37m· npm install\x1b[0m \x1b[90m(Installs all dependencies required)\x1b[0m";
  }

  console.clear();
  console.log(...toLog);
  process.exit(0);
} catch (error) {
  console.error(error);
}

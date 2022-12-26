#! /usr/bin/env node

import inquirer from "inquirer";
import mri from "mri";
import { downloadTemplate } from "giget";
import { createSpinner } from "nanospinner";
import { readFile, writeFile } from "fs/promises";

console.clear();
console.log("\x1b[1m\x1b[34mcreate-discord-bot\x1b[0m");

const argv = process.argv.slice(2);
let directoryPath = "";
let language: "typescript" | "javascript" = "typescript";
let logger: "default" | "pino" = "pino";
let deployment: string[] = [];
let eslint = true;
let prettier = true;

const args = mri(argv, {
  alias: {
    eslint: ["esl", "es", "e"],
    prettier: ["prt", "pr", "p"],
    language: ["lang", "l"],
    logger: ["log", "lo"],
    directory: ["dir", "d"],
    deployment: ["de", "deploy", "dep", "deployments"],
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const questions: any = [];

if (args.directory) {
  if (args.directory.endsWith("/")) {
    directoryPath = args.directory.slice(0, -1);
  }
  directoryPath = args.directory;
} else {
  questions.push({
    message: "Where would you like to create the discord bot ?",
    type: "input",
    name: "directoryPath",
    default: "./",
    filter(value: string) {
      if (value.endsWith("/")) {
        return value.slice(0, -1);
      }
      return value;
    },
  });
}

if (args.language) {
  language = args.language.toLowerCase();
} else {
  questions.push({
    message: "What language do you want to use ?",
    name: "language",
    type: "list",
    choices: ["Typescript", "Javascript"],
    filter(value: string) {
      return value.toLowerCase();
    },
  });
}

if (args.logger) {
  logger = args.logger.toLowerCase();
} else {
  questions.push({
    message: "What type of logging do you want to use ?",
    name: "logger",
    type: "list",
    choices: ["Default", "Pino"],
    filter(value: string) {
      return value.toLowerCase();
    },
  });
}

if (args.deployment) {
  if (args.deployment.includes(",")) {
    deployment = args.deployment.split(",");
  } else {
    deployment = [args.deployment];
  }
} else {
  questions.push({
    message: "What deployment method(s) do you want to use ?",
    name: "deployment",
    type: "checkbox",
    choices: [
      {
        name: "Global",
        checked: true,
      },
      {
        name: "Guild",
      },
    ],
    filter(value: string[]) {
      return value.map((value) => {
        if (value === "Global") {
          return "registergl";
        } else if (value === "Guild") {
          return "registergu";
        }
      });
    },
  });
}

if (args.prettier) {
  prettier = JSON.parse(args.prettier);
} else {
  questions.push({
    message: "Do you want to enable Prettier ?",
    type: "confirm",
    name: "prettier",
  });
}

if (args.eslint) {
  eslint = JSON.parse(args.eslint);
} else {
  questions.push({
    message: "Do you want to enable ESLint ?",
    type: "confirm",
    name: "eslint",
  });
}

const initializeProject = async () => {
  console.clear();
  const spinner = createSpinner("Setting up your project...");
  spinner.start();
  try {
    await downloadTemplate(
      `github:flzyy/create-discord-bot/templates/${language}/${logger}`,
      {
        dir: directoryPath,
        force: true,
      },
    );

    const length = deployment.length;
    for (let i = 0; i < length; i++) {
      await downloadTemplate(
        `github:flzyy/create-discord-bot/templates/deploy/${language}/${logger}/${
          deployment[i]
        }`,
        {
          dir: `${directoryPath}/src/`,
          force: true,
        },
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
          },
        );

        if (language === "typescript") {
          object["devDependencies"][
            "@typescript-eslint/eslint-plugin"
          ] = "^5.46.1";
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
          },
        );

        if (eslint === true) {
          const data = await readFile(`${directoryPath}/.eslintrc.json`);

          if (data) {
            const object = JSON.parse(data.toString());

            object["extends"].push("prettier");

            await writeFile(
              `${directoryPath}/.eslintrc.json`,
              JSON.stringify(object, null, "\t"),
            );
          }
        }
        object["devDependencies"]["prettier"] = "^2.8.1";
      }

      await writeFile(
        `${directoryPath}/package.json`,
        JSON.stringify(object, null, "\t"),
      );
    }

    await writeFile(
      `${directoryPath}/.env`,
      'DISCORD_TOKEN="YOUR TOKEN HERE"\nCLIENT_ID="YOUR CLIENT ID HERE"\nGUILD_ID="YOUR GUILD ID HERE"',
    );

    spinner.success({ text: "Done!" });
    console.log("\x1b[1m\x1b[34mNext steps:\x1b[0m");
    console.log(
      `\x1b[37m1. cd ${directoryPath}\x1b[0m`,
      "\x1b[90m(Puts your terminal into the folder)\x1b[0m",
    );
    console.log(
      "\x1b[37m2. npm install\x1b[0m",
      "\x1b[90m(Installs all dependencies required)\x1b[0m",
    );
    console.log("\x1b[37m3. Fill out .env file\x1b[0m");
    console.log(
      "\x1b[37m4. npm start\x1b[0m",
      "\x1b[90m(Starts the bot)\x1b[0m",
    );
  } catch (error) {
    spinner.error({
      text: `\x1b[90m An error has occured: ${`\x1b[31m${error}\x1b[0m`}`,
    });
  }
};

inquirer
  .prompt(questions)
  .then(async (answers) => {
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

    await initializeProject();
  })
  .catch((error) => {
    console.error("\x1b[31m", error);
  });

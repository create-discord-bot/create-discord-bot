#! /usr/bin/env node

import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import { downloadTemplate } from "giget";
import { readFile, writeFile } from "fs/promises";

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));
console.clear();
console.log("\x1b[1m\x1b[34mcreate-discord-bot\x1b[0m");
const defaultNames = [
  "awesome-bot",
  "wicked-bot",
  "a-nice-bot",
  "cool-bot",
  "a-bot",
  "general-purpose-bot",
  "the-bot",
  "sbot",
];

const questions = [
  {
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
  },
  {
    message: "What is the name of your bot ?",
    type: "input",
    name: "botName",
    default: defaultNames[Math.floor(Math.random() * defaultNames.length)],
  },
  {
    message: "What language do you want to use ?",
    name: "language",
    type: "list",
    choices: ["Typescript", "Javascript"],
    filter(value: string) {
      return value.toLowerCase();
    },
  },
  {
    message: "What type of logging do you want to use ?",
    name: "logger",
    type: "list",
    choices: ["Default", "Pino"],
    filter(value: string) {
      return value.toLowerCase();
    },
  },
  {
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
  },
  {
    message: "Do you want to enable ESLint ?",
    type: "confirm",
    name: "eslint",
  },
  {
    message: "Do you want to enable Prettier ?",
    type: "confirm",
    name: "prettier",
  },
];

inquirer
  .prompt(questions)
  .then(async (answers) => {
    console.clear();

    const spinner = createSpinner("Setting up your project...");
    spinner.start();
    sleep();

    try {
      spinner.update({ text: "Downloading Main Files" });
      await downloadTemplate(
        `github:flzyy/create-discord-bot/templates/${answers.language}/${answers.logger}`,
        {
          dir: answers.directoryPath,
          force: true,
        },
      );

      const length = answers.deployment.length;
      spinner.update({
        text: `Setting up Deployment ${length > 1 ? "methods" : "method"}`,
      });
      for (let i = 0; i < length; i++) {
        await downloadTemplate(
          `github:flzyy/create-discord-bot/templates/deploy/${answers.language}/${answers.logger}/${
            answers.deployment[i]
          }`,
          {
            dir: `${answers.directoryPath}/src/`,
            force: true,
          },
        );
      }

      const data = await readFile(`${answers.directoryPath}/package.json`);

      if (data) {
        const object = JSON.parse(data.toString());
        let prestart = "";

        object["name"] = answers.botName;

        for (let i = 0; i < length; i++) {
          object["scripts"][answers.deployment[i]] = `${
            answers.language === "typescript" ? "npx tsx" : "node"
          } src/${answers.deployment[i]}.${
            answers.language === "typescript" ? "ts" : "js"
          }`;
        }

        if (
          answers.deployment.includes("registergu") &&
          answers.deployment.includes("registergl")
        ) {
          prestart += "npm run registergu && npm run registergl";
        } else if (answers.deployment.includes("registergu")) {
          prestart += "npm run registergu";
        } else if (answers.deployment.includes("registergul")) {
          prestart += "npm run registergl";
        }

        if (answers.logger === "pino") {
          prestart += "| npx pino-pretty";
        }

        object["scripts"]["prestart"] = prestart;

        await writeFile(
          `${answers.directoryPath}/package.json`,
          JSON.stringify(object, null, "\t"),
        );
      }

      if (answers.eslint === true) {
        spinner.update({ text: "Setting up ESLint" });
        await downloadTemplate(
          `github:flzyy/create-discord-bot/templates/eslint/${answers.language}`,
          {
            dir: answers.directoryPath,
            force: true,
          },
        );

        if (answers.language === "typescript") {
          const data = await readFile(`${answers.directoryPath}/package.json`);

          if (data) {
            const object = JSON.parse(data.toString());

            object["devDependencies"]["@typescript-eslint/eslint-plugin"] =
              "^5.46.1";
            object["devDependencies"]["@typescript-eslint/parser"] = "^5.46.1";
            object["devDependencies"]["eslint"] = "^8.29.0";

            await writeFile(
              `${answers.directoryPath}/package.json`,
              JSON.stringify(object, null, "\t"),
            );
          }
        } else {
          const data = await readFile(`${answers.directoryPath}/package.json`);

          if (data) {
            const object = JSON.parse(data.toString());

            object["devDependencies"]["eslint"] = "^8.29.0";

            await writeFile(
              `${answers.directoryPath}/package.json`,
              JSON.stringify(object, null, "\t"),
            );
          }
        }
      }

      if (answers.prettier === true) {
        spinner.update({ text: "Setting up Prettier" });
        await downloadTemplate(
          "github:flzyy/create-discord-bot/templates/prettier",
          {
            dir: answers.directoryPath,
            force: true,
          },
        );

        if (answers.eslint === true) {
          const data = await readFile(
            `${answers.directoryPath}/.eslintrc.json`,
          );

          if (data) {
            const object = JSON.parse(data.toString());

            object["extends"].push("prettier");

            await writeFile(
              `${answers.directoryPath}/.eslintrc.json`,
              JSON.stringify(object, null, "\t"),
            );
          }
        }

        const data = await readFile(`${answers.directoryPath}/package.json`);

        if (data) {
          const object = JSON.parse(data.toString());

          object["devDependencies"]["prettier"] = "^2.8.1";

          await writeFile(
            `${answers.directoryPath}/package.json`,
            JSON.stringify(object, null, "\t"),
          );
        }
      }

      await writeFile(
        `${answers.directoryPath}/.env`,
        'DISCORD_TOKEN="YOUR TOKEN HERE"\nCLIENT_ID="YOUR CLIENT ID HERE"\nGUILD_ID="YOUR GUILD ID HERE"',
      );

      spinner.success({ text: "Done!" });
      console.log("\x1b[1m\x1b[34mNext steps:\x1b[0m");
      console.log(
        `\x1b[37m1. cd ${answers.directoryPath}\x1b[0m`,
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
  })
  .catch((error) => {
    console.error("\x1b[31m", error);
  });

#! /usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import { downloadTemplate } from "giget";
import { readFile, writeFile } from "fs/promises";

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));
console.clear();
console.log(chalk.blue.bold("create-discord-bot"));

const questions = [
    {
        message: "Where would you like to create the discord bot:",
        type: "input",
        name: "directoryPath",
        default: "./"
    },
    {
        message: "Language to use:",
        name: "language",
        type: "list",
        choices: ["Typescript", "Javascript"],
        filter(value) {
            return value.toLowerCase();
        }
    },
    {
        message: "Do you want to enable ESLint:",
        type: "confirm",
        name: "eslint"
    },
    {
        message: "Do you want to enable Prettier:",
        type: "confirm",
        name: "prettier"
    }
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
                `github:flzyy/create-discord-bot/templates/${answers.language}`,
                {
                    dir: answers.directoryPath,
                    force: true
                }
            );

            if (answers.eslint === true) {
                spinner.update({ text: "Setting up ESLint" });
                await downloadTemplate(
                    `github:flzyy/create-discord-bot/templates/eslint/${answers.language}`,
                    {
                        dir: answers.directoryPath,
                        force: true
                    }
                );

                if (answers.language === "typescript") {
                    const data = await readFile(
                        `${answers.directoryPath}/package.json`
                    );

                    if (data) {
                        const object = JSON.parse(data);

                        object["devDependencies"][
                            "@typescript-eslint/eslint-plugin"
                        ] = "^5.46.1";
                        object["devDependencies"]["@typescript-eslint/parser"] =
                            "^5.46.1";
                        object["devDependencies"]["eslint"] = "^8.29.0";

                        await writeFile(
                            `${answers.directoryPath}/package.json`,
                            JSON.stringify(object, null, "\t")
                        );
                    }
                } else {
                    const data = await readFile(
                        `${answers.directoryPath}/package.json`
                    );

                    if (data) {
                        const object = JSON.parse(data);

                        object["devDependencies"]["eslint"] = "^8.29.0";

                        await writeFile(
                            `${answers.directoryPath}/package.json`,
                            JSON.stringify(object, null, "\t")
                        );
                    }
                }
            }

            if (answers.prettier === true) {
                spinner.update({ text: "Setting up Prettier" });
                await downloadTemplate(
                    `github:flzyy/create-discord-bot/templates/prettier`,
                    {
                        dir: answers.directoryPath,
                        force: true
                    }
                );

                if (answers.eslint === true) {
                    const data = await readFile(
                        `${answers.directoryPath}/.eslintrc.json`
                    );

                    if (data) {
                        const object = JSON.parse(data);

                        object["extends"].push("prettier");

                        await writeFile(
                            `${answers.directoryPath}/.eslintrc.json`,
                            JSON.stringify(object, null, "\t")
                        );
                    }
                }

                const data = await readFile(
                    `${answers.directoryPath}/package.json`
                );

                if (data) {
                    const object = JSON.parse(data);

                    object["devDependencies"]["prettier"] = "^2.8.1";

                    await writeFile(
                        `${answers.directoryPath}/package.json`,
                        JSON.stringify(object, null, "\t")
                    );
                }
            }

            await writeFile(
                `${answers.directoryPath}/.env`,
                'DISCORD_TOKEN="YOUR TOKEN HERE"\nCLIENT_ID="YOUR CLIENT ID HERE"'
            );
            spinner.success({ text: "Done!" });
            console.log(`${chalk.bold.blue("Next steps:")}
    1. npm install ${chalk.gray("(Installs all dependencies required)")}
    2. Fill out .env file
    3. "npm start" ${chalk.gray("(Starts the bot)")}`);
        } catch (error) {
            spinner.error({
                text: `An error has occurred: ${chalk.red(error)}`
            });
        }
    })
    .catch((error) => {
        console.error(chalk.red(error));
    });

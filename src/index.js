#! /usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import { downloadTemplate } from "giget";

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
            await downloadTemplate(
                `github:flzyy/create-discord-bot/templates/${answers.language}`,
                {
                    dir: answers.directoryPath,
                    force: true
                }
            );

            if (answers.eslint === true) {
                await downloadTemplate(
                    `github:flzyy/create-discord-bot/templates/eslint/${answers.language}`,
                    {
                        dir: answers.directoryPath,
                        force: true
                    }
                );
            }

            spinner.success({ text: "Done!" });
            sleep();
        } catch (error) {
            spinner.error({
                text: `An error has occurred: ${chalk.red(error)}`
            });
        }
    })
    .catch((error) => {
        console.error(chalk.red(error));
    });

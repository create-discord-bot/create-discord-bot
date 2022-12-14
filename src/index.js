#! /usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import { createSpinner } from "nanospinner";
import { writeFile } from "node:fs/promises";

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

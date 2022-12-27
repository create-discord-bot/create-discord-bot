import * as dotenv from "dotenv";
dotenv.config();
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

import { REST, Routes } from "discord.js";
import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import logger from "./utils/logger";
const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = [];
const commandsPath = join(__dirname, "commands");
const commandFiles = await readdir(commandsPath);
const filtered = commandFiles.filter((file) => file.endsWith(".js"));

const length = filtered.length;
for (let i = 0; i < length; i++) {
  const { command } = await import(join(commandsPath, filtered[i]));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(token);

if (commands.length > 0) {
  try {
    logger.info(
      `Started registering ${commands.length} application (/) commands.`
    );
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
    logger.info(
      `Successfully registered ${data.length} application (/) commands.`
    );
  } catch (error) {
    logger.error(error);
  }
} else {
  logger.warn("There are no global commands");
}

// Dotenv Init
import * as dotenv from "dotenv";
dotenv.config();
const token = process.env.DISCORD_TOKEN;

// Dependencies Init
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import logger from "./utils/logger";
const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Command Init
(async () => {
  client.commands = new Collection();
  const commandsPath = join(__dirname, "commands");
  const commandFiles = await readdir(commandsPath);
  commandFiles.filter((file) => file.endsWith(".js"));

  const length = commandFiles.length;
  for (let i = 0; i < length; i++) {
    const filePath = join(commandsPath, commandFiles[i]);
    const { command } = await import(filePath);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      logger.error(`Invalid Command: ${commandFiles[i]}`);
    }
  }
})();

// Events Init
(async () => {
  const eventsPath = join(__dirname, "events");
  const eventFiles = await readdir(eventsPath);
  const eventFilesFiltered = eventFiles.filter((file) => file.endsWith(".ts"));

  const length = eventFilesFiltered.length;
  for (let i = 0; i < length; i++) {
    const filePath = join(eventsPath, eventFilesFiltered[i]);
    const { event } = await import(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
})();

client.login(token);

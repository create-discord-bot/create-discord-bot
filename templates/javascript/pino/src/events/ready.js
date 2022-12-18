import { Events } from "discord.js";
import logger from "../utils/logger";

export const event = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logger.info(`${client.user.tag} is up!`);
    }
};

import { Client, Events } from 'discord.js';
import logger from '../utils/logger.js';

export const event = {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        logger.info(`${client.user.tag} is up!`);
    }
};
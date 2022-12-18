import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export const command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Returns ping."),
    async execute(interaction) {
        const embed = new EmbedBuilder();

        embed.setTitle("🏓 **Pong!**");
        embed.setFields([
            {
                name: "Websocket Ping:",
                value: interaction.client.ws.ping.toString() + "ms"
            },
            {
                name: "Response sent in:",
                value:
                    (Date.now() - interaction.createdTimestamp).toString() +
                    "ms"
            }
        ]);

        await interaction.reply({
            embeds: [embed]
        });
    }
};

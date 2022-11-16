import { BigString, Interaction } from "https://deno.land/x/discordeno@17.0.1/mod.ts";
import { ButtonStyles, MessageComponentTypes, startBot } from "./deps.ts";
import { bot } from "./discord.ts";

const participants: Set<BigInt> = new Set();

bot.events.ready = async function (bot): Promise<void> {
    console.log("Successfully connected to gateway");
    await bot.helpers.editBotStatus({
        activities: [{ name: "with gifts", type: 0, createdAt: Date.now() }],
        status: "online",
    });
    await bot.helpers.sendMessage(Deno.env.get("DISCORD_CHANNEL") as BigString, {
        content: "",
        embeds: [
            {
                title: "🎄The Odneb secret santa is here!🎄",
                description: "Click on the Join! 🎁 button to participate to the secret santa! You will be matched with another participant and you will have to send them a gift!",
                url: "https://github.com/Loadeksdi/odneb-secret-santa",
                color: 0xbb2528
            }
        ],
        components: [
            {
                type: MessageComponentTypes.ActionRow,
                components: [
                    {
                        customId: "join",
                        type: MessageComponentTypes.Button,
                        label: "Join! 🎁",
                        style: ButtonStyles.Success,
                    },
                    {
                        customId: "leave",
                        type: MessageComponentTypes.Button,
                        label: "Nevermind! 🎄",
                        style: ButtonStyles.Danger,
                    },
                ],
            },
        ],
    });
};

bot.events.interactionCreate = async (_, interaction: Interaction) => {
    if (!interaction.data) {
        return;
    }
    if (interaction.data.customId === "join") {
        if (!participants.has(interaction.user.id)) {
            return;
        }
        participants.add(interaction.user.id);
        await bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
            type: 4,
            data: {
                content: `<@${interaction.user.id}> joined the secret santa!`,
            }
        });
    } else if (interaction.data.customId === "leave") {
        participants.delete(interaction.user.id);
        await bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
            type: 4,
            data: {
                content: `<@${interaction.user.id}> left the secret santa!`,
            }
        });
    }
    console.log(participants);
};

await startBot(bot);

import { BigString, Interaction, Message } from "https://deno.land/x/discordeno@17.0.1/mod.ts";
import { ButtonStyles, MessageComponentTypes, startBot } from "./deps.ts";
import { bot } from "./discord.ts";

const participants: Set<BigInt> = new Set();
let participationMessage: Message;
const channel = Deno.env.get("DISCORD_CHANNEL") as BigString;

const createMatches = () => {
    const participantsArray = Array.from(participants);
    const participantsCopy = Array.from(participants);
    const matches: Map<BigInt, BigInt> = new Map();
    for (const participant of participantsArray) {
        const match = participantsCopy[Math.floor(Math.random() * participantsCopy.length)];
        if (match === participant) {
            participantsCopy.splice(participantsCopy.indexOf(match), 1);
            continue;
        }
        matches.set(participant, match);
        participantsCopy.splice(participantsCopy.indexOf(match), 1);
    }
    return matches;
}

const sendMessageToMatches = async (matches: Map<BigInt, BigInt>) => {
    for (const [participant, match] of matches) {
        const matchedUser = await bot.helpers.getMember(channel, match as BigString);
        await bot.helpers.sendMessage(participant as BigString, {
            content: `You have been matched with ${matchedUser.user?.username}, you better send them a nice gift! 🎁`,
        });
    }
}

bot.events.ready = async function (bot): Promise<void> {
    console.log("Successfully connected to gateway");
    await bot.helpers.editBotStatus({
        activities: [{ name: "with gifts", type: 0, createdAt: Date.now() }],
        status: "online",
    });
    participationMessage = await bot.helpers.sendMessage(channel, {
        embeds: [
            {
                title: "🎄The Odneb secret santa is here!🎄",
                description: "Click on the Join! 🎁 button to participate to the secret santa! You will be matched with another participant and will have to send them a gift!",
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
        if (participants.has(interaction.user.id)) {
            return;
        }
        participants.add(interaction.user.id);
        await bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
            type: 4,
            data: {
                content: `<@${interaction.user.id}> joined the secret santa! 🧑‍🎄`,
            }
        });
    } else if (interaction.data.customId === "leave") {
        participants.delete(interaction.user.id);
        await bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
            type: 4,
            data: {
                content: `<@${interaction.user.id}> left the secret santa! 🧑‍🎄`,
            }
        });
    }
    if (interaction.data.name === "start" && interaction.user.id as BigString == Deno.env.get("DISCORD_OWNER")) {
        if (participants.size < 2) {
            await bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: 4,
                data: {
                    content: "Not enough participants! ☃️",
                }
            });
            return;
        }
        await bot.helpers.deleteMessage(channel, participationMessage.id);
        const matches = createMatches();
        await bot.helpers.sendInteractionResponse(interaction.id, interaction.token, {
            type: 4,
            data: {
                content: "Matches have been generated! 🎁",
            }
        });
        await sendMessageToMatches(matches);  
    }
};

bot.helpers.createGuildApplicationCommand({
    name: "start",
    description: "Start the secret santa matching 🧑‍🎄"
}, Deno.env.get("DISCORD_GUILD") as BigString);

await startBot(bot);
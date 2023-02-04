const {
  Events,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const API = "https://users.roblox.com/v1/users/";
const axios = require("axios");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const BLOXLINK_KEY = process.env.BLOXLINK_API;
const uri = process.env.DATABASE_LOGIN;
const foreignerRole = process.env.FOREIGNER_ROLE;
const verifiedRole = process.env.VERIFIED_ROLE;
const privateRole = process.env.PRIVATE_ROLE;
const guild_id = process.env.CLIENT_SERVER;
const ROVER_KEY = process.env.ROVER_API;
const secretChoices = [
  "dog",
  "cat",
  "taco",
  "door",
  "developer",
  "green",
  "red",
  "tree",
  "water",
  "truth",
  "happy",
  "sad",
  "coder",
];

async function validateCode(code) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verification_codes");
    const query = { code: code };

    const cursor = col.find(query);
    const results = await cursor.toArray();
    for (let i = 0; i < results.length; i++) {
      if (results[i].code === code) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function getActiveVerificationCodes(discord_id) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verification_codes");
    const query = { discord_id: discord_id.toString() };

    const cursor = col.find(query);
    const results = await cursor.toArray();
    return results;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function addVerifiedUser(roblox_id, discord_id) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verified_users");
    const query = { roblox_id: roblox_id, discord_id: discord_id };
    const result = await col.insertOne(query);
    return result;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function removeActiveVerificationCodes(discord_id) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verification_codes");
    const query = { discord_id: discord_id };
    const result = await col.deleteMany(query);
    return result;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function getBloxlinkUser(discord_id) {
  var data = '{\r\n    "roleId": 89159012\r\n}';

  var config = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://v3.blox.link/developer/discord/" + discord_id,
    headers: {
      "api-key": BLOXLINK_KEY,
    },
    data: data,
  };

  return axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
      return null;
    });
}

async function getRoverUser(discord_id) {
  var config = {
    method: "get",
    maxBodyLength: Infinity,
    url:
      "https://registry.rover.link/api/guilds/" +
      guild_id +
      "/discord-to-roblox/" +
      discord_id,
    headers: {
      Authorization: "Bearer " + ROVER_KEY,
    },
  };
  return axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
      return null;
    });
}

async function updateUser(interaction, username, discord_id) {
  const client = new MongoClient(uri);

  const guild = await interaction.client.guilds.cache.get(guild_id);
  const member = await guild.members.cache.get(discord_id);
  try {
    await client.connect();
    const col = client.db("cipher").collection("verified_users");
    const query = { discord_id: discord_id.toString() };

    const cursor = col.find(query);
    const results = await cursor.toArray();
    if (results.length === 0) {
      return false;
    }

    try {
      await member.roles.add(verifiedRole);
      await member.roles.add(privateRole);
      await member.roles.remove(foreignerRole);
      await member.setNickname(username, "Updating username");
    } catch (e) {
      console.error("Could not update user: " + member.id);
    }

    return true;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function addActiveVerificationCodes(roblox_id, discord_id, code) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verification_codes");
    const query = {};

    const cursor = col.find(query);
    const r = await cursor.toArray();
    for (let i = 0; i < r.length; i++) {
      if (r[i].discord_id === discord_id) {
        return;
      }
      if (r[i].code === code) {
        return;
      }
    }
    const doc = {
      roblox_id: roblox_id,
      discord_id: discord_id,
      code: code,
    };

    const results = await col.insertOne(doc);
    return results;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function validateVerifiedUser(discord_id, roblox_id) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verified_users");

    const query1 = { discord_id: discord_id.toString() };
    const cursor1 = col.find(query1);
    const results1 = await cursor1.toArray();
    if (results1.length > 0) {
      return true;
    }

    const query2 = { roblox_id: roblox_id.toString() };
    const cursor2 = col.find(query2);
    const results2 = await cursor2.toArray();
    if (results2.length > 0) {
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
async function validateCode(code) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verification_codes");
    const query = { code: code };

    const cursor = col.find(query);
    const results = await cursor.toArray();
    for (let i = 0; i < results.length; i++) {
      if (results[i].code === code) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

async function validateVerifiedUser(discord_id, roblox_id) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verified_users");

    const query1 = { discord_id: discord_id.toString() };
    const cursor1 = col.find(query1);
    const results1 = await cursor1.toArray();
    if (results1.length > 0) {
      return true;
    }

    const query2 = { roblox_id: roblox_id.toString() };
    const cursor2 = col.find(query2);
    const results2 = await cursor2.toArray();
    console.log(results2);
    if (results2.length > 0) {
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
const cooldowns = new Collection();

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }
      try {
        await command.execute(interaction);
        if (!cooldowns.has(command.name)) {
          cooldowns.set(command.name, new Collection());
        }
        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        //two as default cooldown
        const cooldownAmount = (command.cooldown || 10) * 1000;
        if (timestamps.has(interaction.user.id)) {
          const expirationTime =
            timestamps.get(interaction.user.id) + cooldownAmount;
          if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply(
              `Please wait ${timeLeft.toFixed(
                1
              )} more seconds before using that command again`
            );
          }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(
          () => timestamps.delete(interaction.user.id),
          cooldownAmount
        );
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
      }
    } else if (interaction.isStringSelectMenu()) {
      const method = interaction.values[0];

      if (method === "Bloxlink") {
        const bloxlinkUser = await getBloxlinkUser(interaction.user.id);
        if (bloxlinkUser === null) {
          interaction.reply({
            content:
              "You do not have a Bloxlink account. Please create one and try again.",
            ephemeral: true,
          });
          return;
        }
        const roblox_id = bloxlinkUser.user.robloxId;
        const discord_id = interaction.user.id;
        const response = await axios.get(API + roblox_id);
        const username = response.data.name;
        await addVerifiedUser(roblox_id, discord_id);
        await updateUser(interaction, username, discord_id);
        await interaction.reply({
          content: "You have been verified!",
        });
      } else if (method === "Rover") {
        const roverUser = await getRoverUser(interaction.user.id);
        if (roverUser === null) {
          interaction.reply({
            content:
              "You do not have a Rover account. Please create one and try again.",
            ephemeral: true,
          });
          return;
        }
        const roblox_id = roverUser.robloxId;
        const discord_id = interaction.user.id;
        const response = await axios.get(API + roblox_id);
        const username = response.data.name;
        await addVerifiedUser(roblox_id, discord_id);
        await updateUser(interaction, username, discord_id);
        await interaction.reply({
          content: "You have been verified!",
        });
      } else if (method.startsWith("Profile")) {
        const userId = method.split("|")[1];
        const username = method.split("|")[2];

        const verifyDescription = secretChoices
          .sort(() => Math.random() - 0.5)
          .slice(0, 5)
          .join(" ");

        const exisitingCode = await validateCode(verifyDescription);
        const exisitingVerifiedUser = await validateVerifiedUser(
          interaction.user.id,
          userId
        );
        if (exisitingCode) {
          await interaction.editReply({
            content: "An error has occured. Please try again.",
          });
          return;
        }
        if (exisitingVerifiedUser) {
          await interaction.editReply({
            content:
              "An account with either your discord id or roblox id already exists.",
          });
          return;
        }

        const initalEmbed = new EmbedBuilder()
          .setTitle("Profile Verification")
          .setDescription(
            `You're trying to verify your Discord account with the \`${username}\` account on ROBLOX. 
            If you want to continue, please complete the following steps:
            **1.** Go to https://www.roblox.com/users/${userId}/profile
            **2.** Click the \`Edit\` button on the top right of the page.
            **3.** Copy and paste the following code into the \`About Me\` section: **${verifyDescription}**
            **4.** Click the \`Save\` button on the bottom right of the page.
            **5.** Click the \`Update\` button below this message.
            `
          )
          .setTimestamp()
          .setFooter({
            text: interaction.user.id,
            iconURL: interaction.user.displayAvatarURL({ extension: "jpg" }),
          });
        await addActiveVerificationCodes(
          userId.toString(),
          interaction.user.id.toString(),
          verifyDescription
        );
        await interaction.reply({
          embeds: [initalEmbed],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setStyle("Success")
                .setLabel("Update")
                .setCustomId("verify"),
              new ButtonBuilder()
                .setStyle("Danger")
                .setLabel("Cancel")
                .setCustomId("cancel")
            ),
          ],
        });
      } else {
        await interaction.message.delete();
        return;
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === "verify") {
        const results = await getActiveVerificationCodes(interaction.user.id);
        if (results.length === 0) {
          interaction.reply({
            content: "This verification code is no longer active.",
            ephemeral: true,
          });
          return;
        }
        const roblox_id = results[0].roblox_id;
        const discord_id = results[0].discord_id;
        const code = results[0].code;

        const response = await axios.get(API + roblox_id);
        const newDescription = response.data.description;
        const username = response.data.name;
        console.log(newDescription);
        console.log(code);
        if (!newDescription.includes(code)) {
          interaction.reply({
            content:
              "There was an error. Please check the correct code and try again.",
            ephemeral: true,
          });
          return;
        }
        await addVerifiedUser(roblox_id, discord_id);
        await removeActiveVerificationCodes(discord_id);
        await updateUser(interaction, username, discord_id);
        await interaction.reply({
          content: "You have been verified!",
        });
      } else if (interaction.customId === "cancel") {
        await removeActiveVerificationCodes(interaction.user.id);
        await interaction.reply({
          content: "You have cancelled the verification process.",
        });
        return;
      }
    }
  },
};

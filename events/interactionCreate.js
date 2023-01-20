const {
  Events,
  Collection,
  ApplicationCommandPermissionType,
} = require("discord.js");
const API = "https://users.roblox.com/v1/users/";
const axios = require("axios");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const uri = process.env.DATABASE_LOGIN;
const foreignerRole = process.env.FOREIGNER_ROLE;
const verifiedRole = process.env.VERIFIED_ROLE;

async function getActiveVerificationCodes() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verification_codes");
    const query = {};

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

async function updateUser(member, username, discord_id) {
  const client = new MongoClient(uri);

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
    } else if (interaction.isButton()) {
      if (interaction.customId === "verify") {
        const results = await getActiveVerificationCodes();
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
        if (!newDescription.includes(code)) {
          interaction.reply({
            content:
              "There was an error. Please check the correct code and try again.",
            ephemeral: true,
          });
          return;
        }
        const member = await interaction.guild.members.cache.get(discord_id);
        await addVerifiedUser(roblox_id, discord_id);
        await removeActiveVerificationCodes(discord_id);
        await updateUser(member, username, discord_id);
        await interaction.reply({
          content: "You have been verified!",
        });
      }
    }
  },
};

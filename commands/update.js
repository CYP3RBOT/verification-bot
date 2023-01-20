const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const API = "https://users.roblox.com/v1/users/";
const uri = process.env.DATABASE_LOGIN;
const foreignerRole = process.env.FOREIGNER_ROLE;
const verifiedRole = process.env.VERIFIED_ROLE;

async function updateUser(interaction, discord_id) {
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
    const userId = results[0].roblox_id;

    const r = await axios.get(API + userId);
    const json = r.data;
    username = json.name;

    const member = await interaction.guild.members.cache.get(discord_id);

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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("Updates your username in the server")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to update")
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser("user");

    if (interaction.member.roles.cache.has(foreignerRole) && user) {
      return interaction.editReply({
        content: "You are not allowed to update other users.",
      });
    }
    let response;
    if (user) {
      response = await updateUser(interaction, user.id);
    } else {
      response = await updateUser(interaction, interaction.user.id);
    }
    if (response) {
      await interaction.editReply({
        content: "User updated.",
      });
      return;
    } else {
      await interaction.editReply({
        content: "User is not verified.",
      });
      return;
    }
  },
};

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const API = "https://users.roblox.com/v1/users/";
const axios = require("axios");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.DATABASE_LOGIN;

async function validateQuery(discord_id) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verification_codes");

    const query1 = { discord_id: discord_id.toString() };
    const cursor1 = col.find(query1);
    const results1 = await cursor1.toArray();
    if (results1.length > 0) {
      return true;
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
module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Connect your ROBLOX account with your Discord account")
    .addStringOption((option) =>
      option
        .setName("roblox_user")
        .setDescription("The ROBLOX user to verify with")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const exisitingQuery = await validateQuery(interaction.user.id);

    if (exisitingQuery) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(
          "A verification query already exists. Please finish that one or cancel it before proceeding."
        );
      await interaction.editReply({
        embeds: [embed],
      });
      return;
    }
    const user = interaction.options.getString("roblox_user");

    let userId;
    let username;

    if (isNaN(user)) {
      const A = "https://api.roblox.com/users/get-by-username?username=" + user;
      const response = await axios.get(A);
      const json = response.data;
      userId = json.Id;
      username = json.Username;

      if (!userId) {
        const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription(`User \`${user}\` not found. Please try again.`);
        await interaction.editReply({
          embeds: [embed],
        });
        return;
      }
    } else {
      const r = await axios.get(API + user);
      const json = r.data;
      userId = json.Id;
      username = json.Username;

      if (!userId) {
        const embed = new EmbedBuilder()
          .setTitle("Error")
          .setDescription(`User \`${user}\` not found. Please try again.`);
        await interaction.editReply({
          embeds: [embed],
        });
        return;
      }
    }

    const exisitingVerifiedUser = await validateVerifiedUser(
      interaction.user.id,
      userId
    );

    if (exisitingVerifiedUser) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(
          "An account with either your discord id or roblox id already exists."
        );
      await interaction.editReply({
        embeds: [embed],
      });
      return;
    }

    const verificationEmbed = new EmbedBuilder()
      .setTitle("Verify")
      .setDescription(
        `You're trying to verify your Discord account with the \`${username}\` account on ROBLOX.
        
        Please choose one of the options below to continue your verification process.`
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("VerificationMenu")
      .setPlaceholder("Select your verification method")
      .addOptions(
        {
          label: `Bloxlink`,
          description: `Use the bloxlink api to verify your account`,
          value: "Bloxlink",
        },
        {
          label: `Rover`,
          description: `Use the rover api to verify your account`,
          value: "Rover",
        },
        {
          label: `Profile`,
          description: `Use your profile description to verify your account`,
          value: "Profile|" + userId + "|" + username,
        },
        {
          label: `Cancel`,
          description: `Cancel your verification process`,
          value: "Cancel",
        }
      );

    await interaction.member.send({
      embeds: [verificationEmbed],
      components: [new ActionRowBuilder().addComponents(menu)],
    });
    await interaction.editReply({
      content: `<@${interaction.user.id}> check your DMs.`,
    });
  },
};

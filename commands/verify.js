const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const API = "https://users.roblox.com/v1/users/";
const axios = require("axios");
const { MongoClient } = require("mongodb");
require("dotenv").config();

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

const uri = process.env.DATABASE_LOGIN;

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

async function validateQuery(discord_id) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verification_codes");
    const query = { discord_id: discord_id.toString() };

    const cursor = col.find(query);
    const results = await cursor.toArray();
    console.log(results);
    if (results.length > 0) {
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
    const query = { discord_id: discord_id.toString() };

    const cursor = col.find(query);
    const results = await cursor.toArray();
    for (let i = 0; i < results.length; i++) {
      if (results[i].discord_id === discord_id) {
        return true;
      }
      if (results[i].roblox_id === roblox_id) {
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Connect your ROBLOX account with your Discord account")
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The ROBLOX user to check")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const exisitingQuery = await validateQuery(interaction.user.id);

    if (exisitingQuery) {
      await interaction.editReply({
        content:
          "A verification query already exists. Please finish that one or cancel it before proceeding.",
      });
      return;
    }
    const user = interaction.options.getString("user");

    let userId;
    let username;

    if (isNaN(user)) {
      const A = "https://api.roblox.com/users/get-by-username?username=" + user;
      const response = await axios.get(A);
      const json = response.data;
      userId = json.Id;
      username = json.Username;

      if (!userId) {
        await interaction.editReply({
          content: "User not found.",
        });
        return;
      }
    } else {
      const r = await axios.get(API + user);
      const json = r.data;
      userId = json.Id;
      username = json.Username;

      if (!userId) {
        await interaction.editReply({
          content: "User not found.",
        });
        return;
      }
    }

    const response = await axios.get(API + userId);
    const oldDescription = response.data.description;

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
      .setTitle("Verify Command")
      .setDescription(
        `You're trying to verify your Discord account with the \`${username}\` account on ROBLOX. 
        If you want to continue, please complete the following steps:


        **1.** Go to https://www.roblox.com/users/${userId}/profile
        **2.** Click the \`Edit\` button on the top right of the page.
        **3.** Copy and paste the following code into the \`About Me\` section: **${verifyDescription}**
        **4.** Click the \`Save\` button on the bottom right of the page.
        **5.** Click the \`Update\` button below this message.

        Don't worry, I've went ahead and saved your current \`About Me\` section for you: \`\`\`${oldDescription}\`\`\`
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
    await interaction.member.send({
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

    await interaction.editReply({
      content: `<@${interaction.user.id}> check your DMs.`,
    });
  },
};

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const uri = process.env.DATABASE_LOGIN;
const foreignerRole = process.env.FOREIGNER_ROLE;
const verifiedRole = process.env.VERIFIED_ROLE;

async function removeVerifiedUser(discord_id) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const col = client.db("cipher").collection("verified_users");
    const query = { discord_id: discord_id };

    const cursor = col.find(query);
    const results = await cursor.toArray();

    if (results.length === 0) {
      return false;
    } else {
      await col.deleteOne(query);
      return true;
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unverify")
    .setDescription("Remove your verified role and attached account"),
  async execute(interaction) {
    await interaction.deferReply();

    const user = await removeVerifiedUser(interaction.user.id);

    if (!user) {
      await interaction.editReply({
        content: "You are not verified.",
      });
      return;
    } else {
      const guild = interaction.guild;
      const member = await guild.members.fetch(interaction.user.id);

      member.roles.remove(verifiedRole);
      member.roles.add(foreignerRole);

      await interaction.editReply({
        content: "You are no longer verified.",
      });
    }
  },
};

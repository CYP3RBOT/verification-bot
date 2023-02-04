const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const uri = process.env.DATABASE_LOGIN;
const foreignerRole = process.env.FOREIGNER_ROLE;

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
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(
          "You are not verified. Please verify yourself using the </verify:1066111449627369476> command."
        );

      await interaction.editReply({
        embeds: [embed],
      });
      return;
    } else {
      const guild = interaction.guild;
      const member = await guild.members.fetch(interaction.user.id);

      for (const role of member.roles.cache) {
        await member.roles.remove(role);
      }

      member.roles.add(foreignerRole);
      const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(
          "You are no longer verified! Please re-verify yourself using the </verify:1066111449627369476> command."
        );
      await interaction.editReply({
        embeds: [embed],
      });
    }
  },
};

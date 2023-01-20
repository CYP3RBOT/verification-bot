const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ccr")
    .setDescription("Check if a user is on CCR")
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user to check")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    let user = interaction.options.getString("user");

    let userId;
    let username;

    if (isNaN(user)) {
      const API =
        "https://api.roblox.com/users/get-by-username?username=" + user;
      const response = await axios.get(API);
      const json = response.data;
      userId = json.Id;
      username = json.Username;

      if (!userId) {
        await interaction.editReply({
          content: "User not found.",
          ephemeral: true,
        });
        return;
      }
    } else {
      const API = "https://api.roblox.com/users/" + user;
      const response = await axios.get(API);
      const json = response.data;
      userId = json.Id;
      username = json.Username;

      if (!userId) {
        await interaction.editReply({
          content: "User not found.",
          ephemeral: true,
        });
        return;
      }
    }
    const CCR_API = `https://ccr.catgang.ru/check.php?uname=${username}&format=json`;

    const response = await axios.get(CCR_API);
    const json = response.data;
    if (json.evidence.length !== 0 && json.accounts.length !== 0) {
      let clips;

      json.evidence.forEach((evidence) => {
        clips =
          clips +
          `[${evidence.description}](${evidence.evidence}) | *${evidence.timestamp}*\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle("CCR Check")
        .setDescription(`**${username}** is on CCR.`)
        .setTimestamp()
        .addFields(
          {
            name: "Accounts",
            value:
              json.accounts.length >= 1
                ? "```" +
                  json.accounts[0].userid +
                  " (@" +
                  json.accounts[0].username +
                  ")" +
                  "```"
                : "None",
          },
          {
            name: "Evidence",
            value:
              json.evidence.length >= 1 ? clips.split("undefined")[1] : "None",
          }
        )
        .setFooter({
          text: interaction.user.id,
          iconURL: interaction.user.displayAvatarURL({ extension: "jpg" }),
        });

      await interaction.editReply({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setStyle("Link")
              .setLabel("Profile")
              .setURL(`https://www.roblox.com/users/${userId}/profile`)
          ),
        ],
      });
    } else {
      const embed = new EmbedBuilder()
        .setTitle("CCR Check")
        .setDescription(`**${username}** is not on CCR.`)
        .setTimestamp()
        .setFooter({
          text: interaction.user.id,
          iconURL: interaction.user.displayAvatarURL({ extension: "jpg" }),
        });
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

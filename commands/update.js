const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const { MongoClient } = require("mongodb");

require("dotenv").config();

const API = "https://users.roblox.com/v1/users/";
const uri = process.env.DATABASE_LOGIN;
const foreignerRole = process.env.FOREIGNER_ROLE;
const verifiedRole = process.env.VERIFIED_ROLE;
const privateRole = process.env.PRIVATE_ROLE;
const COOKIE = process.env.COOKIE;

async function updateUserGroupRank(user, roleId) {
  var data = JSON.stringify({
    roleId: roleId,
  });
  var config = {
    method: "patch",
    url: `https://groups.roblox.com/v1/groups/${GROUP}/users/${user}`,
    headers: {
      Cookie: ".ROBLOSECURITY=" + COOKIE + "; GuestData=UserID=-1386140223",
      "Content-Type": "application/json",
      accept: "application/json",
    },
    data: data,
  };

  let responseToken;
  const response = axios(config)
    .then(function (response) {
      SON.stringify(response.data);
    })
    .catch(function (error) {
      return (responseToken = error.response.headers["x-csrf-token"]);
    });
  responseToken = await response;

  var newConfig = {
    method: "patch",
    url: `https://groups.roblox.com/v1/groups/${GROUP}/users/${user}`,
    headers: {
      Cookie: ".ROBLOSECURITY=" + COOKIE + "; GuestData=UserID=-1386140223",
      "Content-Type": "application/json",
      accept: "application/json",
      "x-csrf-token": responseToken,
    },
    data: data,
  };

  const updated = axios(newConfig)
    .then(function (response) {
      JSON.stringify(response.data);
    })
    .catch(function (error) {
      return (responseToken = error.response.headers["x-csrf-token"]);
    });

  if (updated) {
    return true;
  } else {
    return false;
  }
}
async function doGroupUpdate(groupUser, robloxId) {
  const groupRoles = [];
  for (const role of groupUser.roles.cache.values()) {
    if (groupRanks[role.id.toString()]) {
      groupRoles.push(groupRanks[role.id.toString()]);
    }
  }
  if (groupRoles.length === 0) {
    return;
  }
  const maxRank = Math.max(...groupRoles);
  const roleId = groupRolesId[maxRank];

  const response = await axios.get(
    `https://groups.roblox.com/v1/users/${robloxId}/groups/roles`
  );

  const userGroups = response.data;

  const groupMember = userGroups.data.find((groupMember) => {
    return groupMember.group.id === GROUP;
  });

  try {
    if (groupMember.role.id !== maxRank) {
      const data = await updateUserGroupRank(robloxId, roleId);
    }
  } catch (e) {
    return;
  }
}

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
      if (member.roles.cache.has(foreignerRole))
        await member.roles.remove(foreignerRole);

      if (!member.roles.cache.has(verifiedRole))
        await member.roles.add(verifiedRole);

      const hasEnlistedRole = () => {
        for (const role of member.roles.cache.values()) {
          if (
            role.name.startsWith("E2") ||
            role.name.startsWith("E3") ||
            role.name.startsWith("E4") ||
            role.name.startsWith("E5") ||
            role.name.startsWith("E6") ||
            role.name.startsWith("E7") ||
            role.name.startsWith("E8")
          ) {
            return true;
          }
        }
        return false;
      };

      if (!hasEnlistedRole()) {
        await member.roles.add(privateRole);
      }

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
    let focusUser;

    if (interaction.member.roles.cache.has(foreignerRole) && user) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(
          "You cannot update other users if you are not verified."
        );
      await interaction.editReply({
        embeds: [embed],
      });
    }
    let response;
    if (user) {
      response = await updateUser(interaction, user.id);
      focusUser = user.id;
    } else {
      response = await updateUser(interaction, interaction.user.id);
      focusUser = interaction.user.id;
    }
    if (response) {
      const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`<@${focusUser}> has successfully been updated!`);
      await interaction.editReply({
        embeds: [embed],
      });
      return;
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(
          `<@${focusUser}> is not verified. Please verify using the </verify:1066111449627369476> command.`
        );
      await interaction.editReply({
        embeds: [embed],
      });
      return;
    }
  },
};

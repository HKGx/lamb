import { GuildMember, MessageEmbed } from "discord.js";

import { Command, Context } from "../commands";

class AvatarCommand extends Command {
  name = "avatar";
  aliases = ["av"];

  arguments = [{ cls: GuildMember, optional: true }];

  async invoke(ctx: Context, maybeMember?: GuildMember) {
    const member = maybeMember || ctx.message.member;
    if (!member) {
      throw new Error(
        "Member cannot be undefined. This shouldn't have happened"
      );
    }
    const fullname = `${member.user.username}#${member.user.discriminator}`;
    const avatarUrl =
      member.user.avatarURL({
        dynamic: true,
        format: "png",
        size: 2048,
      }) || member.user.defaultAvatarURL;
    const embed = new MessageEmbed()
      .setTitle(`Avatar użytkownika ${fullname}`)
      .setImage(avatarUrl);
    await ctx.reply(embed);
  }
}

export default new AvatarCommand();

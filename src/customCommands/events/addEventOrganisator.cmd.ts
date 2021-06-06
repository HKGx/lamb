import { GuildMember } from "discord.js";

import { Command, Context, isOwner } from "../../commands";
import Event from "../../models/event.model";
import { sanitize } from "../../util";

import addEvent from "./addEvent.cmd";

class EventAddOrganistorComand extends Command {
  name = "organisator";
  aliases = ["org"];
  $resolve = addEvent.derive(this);
  arguments = [String, GuildMember] as const;
  checks = [isOwner];
  async invoke(ctx: Context, eventName: string, member: GuildMember) {
    const name = sanitize(eventName);
    const event = await Event.findOne({ name });
    if (!event) {
      await ctx.reply(`Couldnt't find event \`${name}\`.`);
      return;
    }

    event.organisators.push(member.id);
    await event.save();
    await ctx.reply(`Added \`${member.user.tag}\` to event \`${name}\``);
  }
}

export default new EventAddOrganistorComand();

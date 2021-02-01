import { Util } from "discord.js";

import {
  argument,
  Command,
  Context,
  isOwner,
  stringConverter,
} from "../../commands";
import Event from "../../models/event.model";

import events from "./events.cmd";

class EventAddComand extends Command {
  name = "add";
  $resolve = events.derive(this);
  arguments = [argument("event name", stringConverter)];
  checks = [isOwner];
  async invoke(ctx: Context, eventName: string) {
    const name = Util.escapeMarkdown(eventName);
    const event = await Event.create({ name });
    await ctx.reply(`Stworzono event \`${name}\` with id \`${event.id}\``);
  }
}

export default new EventAddComand();

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

class EventGetCommand extends Command {
  name = "get";
  aliases = ["wez", "weź"];
  $resolve = events.derive(this);
  arguments = [argument("event name", stringConverter)];
  checks = [isOwner];
  async invoke(ctx: Context, eventName: string) {
    const name = Util.escapeMarkdown(eventName);
    const event = await Event.findOne({ name });
    if (!event) {
      await ctx.reply(`Nie znaleziono eventu o nazwie: \`${name}\``);
      return;
    }
    await ctx.reply(`Znaleziono event \`${name}\` with id \`${event.id}\``);
  }
}

export default new EventGetCommand();

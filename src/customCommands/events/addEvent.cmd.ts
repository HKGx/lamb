import { Command, Context, isOwner } from "../../commands";
import Event from "../../models/event.model";
import { sanitize } from "../../util";

import events from "./events.cmd";

class EventAddComand extends Command {
  name = "add";
  $resolve = events.derive(this);
  arguments = [String];
  checks = [isOwner];
  async invoke(ctx: Context, eventName: string) {
    const name = sanitize(eventName);
    const event = await Event.create({ name });
    await ctx.reply(`Stworzono event \`${name}\` with id \`${event.id}\``);
  }
}

export default new EventAddComand();

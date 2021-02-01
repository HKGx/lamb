import {
  argument,
  Command,
  Context,
  isOwner,
  stringConverter,
} from "../../commands";

import addEvent from "./addEvent.cmd";

class EventAddOrganistorComand extends Command {
  name = "organisator";
  $resolve = addEvent.derive(this);
  arguments = [argument("event name", stringConverter)];
  checks = [isOwner];
  async invoke(ctx: Context, eventName: string) {
    await ctx.reply("uwu " + eventName);
  }
}

export default new EventAddOrganistorComand();

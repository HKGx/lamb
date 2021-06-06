import { Command, Context, isOwner } from "../../commands";
import eventModel from "../../models/event.model";

class EventsCommand extends Command {
  name = "events";
  aliases = ["eventy"];
  checks = [isOwner];
  async invoke(ctx: Context) {
    const count = await eventModel.estimatedDocumentCount();
    await ctx.reply(`We currently have ${count} events`);
  }
}

export default new EventsCommand();

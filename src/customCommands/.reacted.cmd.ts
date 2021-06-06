import { Message } from "discord.js";

import { Command, Context } from "../commands";

class ReactedCommand extends Command {
  name = "reacted";
  aliases = ["re"];

  arguments = [Message];
  public async invoke(ctx: Context, message: Message): Promise<void> {
    ctx.message.reply("" + message.id);
  }
}
export default new ReactedCommand();

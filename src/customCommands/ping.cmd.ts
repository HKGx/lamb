import { Command, Context } from "../commands";

class PingCommand extends Command {
  name = "ping";
  
  arguments = [[String] as const] as const;

  async invoke(ctx: Context) {
    await ctx.reply("Pong! 🏓");
  }
}

export default new PingCommand();

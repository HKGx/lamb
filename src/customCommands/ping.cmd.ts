import { Command, Context } from "../commands";

class PingCommand extends Command {
  name = "ping";
  aliases = ["pingu"];

  async invoke(ctx: Context) {
    await ctx.reply("Pong! 🏓");
  }
}

export default new PingCommand();

import { Command, Context } from "../commands";

const RENDERTEX_LINK = "https://rendertex.hkgdoes.dev";

class MathCommand extends Command {
  name = "math";
  arguments = [String];
  async invoke(ctx: Context, math: string) {
    const data = encodeURI(math);
    ctx.reply(`${RENDERTEX_LINK}/latex/jpg/${data}`);
  }
}

export default new MathCommand();

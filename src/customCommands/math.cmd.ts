import { Command, Context } from "../commands";
import { Integer } from "../commands/converters/NumberConverter";

const RENDERTEX_LINK = "https://rendertex.hkgdoes.dev";

class MathCommand extends Command {
  name = "math";
  arguments = [{ cls: Integer, optional: true }, String];
  async invoke(ctx: Context, scale: number | undefined, math: string) {
    const data = encodeURI(math);
    ctx.reply(`${RENDERTEX_LINK}/latex/jpg/${data}?scale=${scale || 1}`);
  }
}

export default new MathCommand();

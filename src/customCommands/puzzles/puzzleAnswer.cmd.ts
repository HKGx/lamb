import { decode } from "js-base64";

import { argument, Command, Context, stringConverter } from "../../commands";
import puzzleModel from "../../models/puzzle.model";

import { puzzleCheck } from "./puzzleGet.cmd";
import puzzlesCmd from "./puzzles.cmd";

class PuzzleAnswerCommand extends Command {
  name = "answer";
  $resolve = puzzlesCmd.derive(this);
  arguments = [argument("puzzle encoded id", stringConverter)];
  checks = [puzzleCheck];
  async invoke(ctx: Context, puzzleIdEncoded: string) {
    const decoded = decode(puzzleIdEncoded);
    const puzzleId = decoded.substr(0, 5);
    const puzzle = await puzzleModel.findById(puzzleId);
    if (!puzzle) {
      await ctx.reply("No such puzzle.");
      return;
    }
    await ctx.message.author.createDM();
    const strings = [
      `ID: \`${puzzle.id}\``,
      `Best move was: \`${puzzle.bestMove}\``,
      `Solve at lichess: https://lichess.org/training/${puzzle.id}`,
    ];
    await ctx.message.author.send(strings.join("\n"));
  }
}

export default new PuzzleAnswerCommand();

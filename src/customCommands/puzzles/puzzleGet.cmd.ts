import { MessageEmbed } from "discord.js";

import { argument, Command, Context, stringConverter } from "../../commands";
import puzzleModel from "../../models/puzzle.model";

import puzzlesCmd, { puzzleCheck } from "./puzzles.cmd";

export { puzzleCheck };

class PuzzleGetCommand extends Command {
  name = "get";
  $resolve = puzzlesCmd.derive(this);
  arguments = [argument("puzzle id", stringConverter)];
  checks = [puzzleCheck];
  async invoke(ctx: Context, puzzleId: string) {
    const puzzle = await puzzleModel.findById(puzzleId);
    if (!puzzle) {
      await ctx.reply("No such puzzle.");
      return;
    }
    const side = puzzle.playerSide;
    const opposingSide = puzzle.opponentSide;
    const opposingMove = puzzle.firstMove;
    const embed = new MessageEmbed({
      title: `${side} to move. ${opposingSide}'s move was ${opposingMove}`,
      description: "You can still reply!",
    })
      .setImage(puzzle.imageUrl)
      .setFooter(puzzle.encodedId);
    await ctx.send({ embed });
  }
}

export default new PuzzleGetCommand();

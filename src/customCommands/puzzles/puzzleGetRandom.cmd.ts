import { MessageEmbed } from "discord.js";

import { Command, Context } from "../../commands";
import puzzleModel from "../../models/puzzle.model";

import puzzleGetCmd, { puzzleCheck } from "./puzzleGet.cmd";

class PuzzleGetRandomCommand extends Command {
  name = "random";
  $resolve = puzzleGetCmd.derive(this);
  checks = [puzzleCheck];
  async invoke(ctx: Context) {
    const count = await puzzleModel.estimatedDocumentCount();
    const amount = Math.floor(Math.random() * count);
    const puzzle = await puzzleModel.findOne().skip(amount);
    if (!puzzle) {
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

export default new PuzzleGetRandomCommand();

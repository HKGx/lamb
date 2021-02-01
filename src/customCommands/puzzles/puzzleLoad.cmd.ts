import { readFile } from "fs/promises";

import { Command, Context, isOwner } from "../../commands";
import puzzleModel, { Puzzle } from "../../models/puzzle.model";

import puzzlesCmd from "./puzzles.cmd";
class PuzzleLoadCommand extends Command {
  name = "load";
  $resolve = puzzlesCmd.derive(this);
  checks = [isOwner];
  async invoke(ctx: Context) {
    const puzzles: unknown = JSON.parse(
      (await readFile("./data/puzzles.json")).toString()
    );
    const ins = await puzzleModel.insertMany(puzzles as Puzzle[], {
      rawResult: true,
    });
    await ctx.reply(`Loaded ${ins.insertedCount} puzzles`);
  }
}

export default new PuzzleLoadCommand();

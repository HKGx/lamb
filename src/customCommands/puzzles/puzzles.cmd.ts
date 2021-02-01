import { Message } from "discord.js";
import { decode } from "js-base64";

import { Bot, Command, Context, isOwner } from "../../commands";
import puzzleModel from "../../models/puzzle.model";
import puzzleUserGuessModel from "../../models/puzzleUserGuess.model";

function endPuzzleChecks(message: Message) {
  return (
    message.author.id === "229739417206521867" ||
    message.author.id === (message.client as Bot).ownerId
  );
}

class PuzzlesCommand extends Command {
  name = "puzzle";
  aliases = ["puzzles"];
  checks = [isOwner];
  async invoke(ctx: Context) {
    const puzzleCount = await puzzleModel.estimatedDocumentCount();
    await ctx.reply(`Jest około ${puzzleCount} puzzli`);
  }

  onMessage = async (message: Message) => {
    const referenced = await message.referencedMessage?.fetch();
    if (!referenced || referenced.author.id !== message.client.user?.id) {
      return;
    }
    const embed = referenced.embeds[0];
    if (!embed?.footer?.text) {
      return;
    }
    const decoded = decode(embed.footer.text);
    const puzzleId = decoded.substr(0, 5);

    const puzzle = await puzzleModel.findById(puzzleId);

    if (!puzzle) {
      return;
    }
    if (embed.hexColor === "#ff0000") {
      await message.reply("The puzzle has ended!");
    }
    if (message.content === "end" && endPuzzleChecks(message)) {
      await referenced.edit({
        embed: embed
          .setColor("#ff0000")
          .setDescription(`Ended! Correct move was \`${puzzle.bestMove}\``),
      });
      return;
    }
    await message.delete();

    const guess = await puzzleUserGuessModel.findOneAndUpdate(
      {
        messageId: referenced.id,
        userId: message.author.id,
      },
      {
        $setOnInsert: { puzzleId },
      },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );
    const dm = await message.author.createDM();
    if (guess.guessed) {
      await dm.send("You've already guessed correctly!");
      return;
    }
    if (guess.guesses > 3) {
      await dm.send("You can't guess anymore.");
      return;
    }

    const bestMove = puzzle.moves.substring(5, 9);

    if (message.content === bestMove) {
      await dm.send(
        `You've guessed correctly with \`${bestMove}\`! It was your ${guess.guesses}. try!`
      );
      await guess.updateOne({ $set: { guessed: true } });
    } else {
      if (guess.guesses === 3) {
        await dm.send("Incorrect guess! You've run out of your guesses.");
      } else {
        const remaining = 3 - guess.guesses;
        await dm.send(
          `Incorrect guess! You still have ${remaining} ${
            remaining === 1 ? "try" : "tries"
          } left`
        );
      }
      await guess.updateOne({ $inc: { guesses: 1 } });
    }
  };
}

export default new PuzzlesCommand();

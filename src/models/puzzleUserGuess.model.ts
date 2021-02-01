import { Document, model, Schema } from "mongoose";

export interface PuzzleUserGuess extends Document {
  messageId: string;
  userId: string;
  guesses: 1 | 2 | 3 | 4;
  puzzleId: string;
  guessed: boolean;
}

const puzzleUserGuessSchema = new Schema<PuzzleUserGuess>({
  messageId: { type: String, required: true },
  userId: { type: String, required: true },
  guesses: { type: Number, default: 1, min: 2, max: 4 },
  puzzleId: { type: String, required: true },
  guessed: { type: Boolean, default: false },
});

export default model<PuzzleUserGuess>("puzzleUserGuess", puzzleUserGuessSchema);

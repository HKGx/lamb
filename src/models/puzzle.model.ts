import { encode } from "js-base64";
import { Chess, Movement } from "light-chess";
import { Document, model, Schema } from "mongoose";

export interface Puzzle extends Document<string> {
  fen: string;
  moves: string;
  rating: number;
  ratingDeviation: number;
  popularity: number;
  nbPlays: number;
  themes: string;
  gameUrl: string;
  firstMove: string;
  bestMove: string;
  playerSide: "Black" | "White";
  opponentSide: "Black" | "White";
  imageUrl: string;
  encodedId: string;
}

const puzzleSchema = new Schema<Puzzle>(
  {
    _id: { type: String },
    fen: { type: String, required: true },
    moves: { type: String, required: true },
    ratingDeviation: { type: Number, required: true },
    rating: { type: Number, required: true },
    popularity: { type: Number, required: true },
    nbPlays: { type: Number, required: true },
    themes: { type: String, required: true },
    gameUrl: { type: String, required: true },
  },
  {
    toJSON: { virtuals: true },
  }
);

puzzleSchema.virtual("firstMove").get(function (this: Puzzle) {
  return this.moves.substr(0, 4);
});

puzzleSchema.virtual("bestMove").get(function (this: Puzzle) {
  return this.moves.substr(5, 4);
});

puzzleSchema.virtual("playerSide").get(function (this: Puzzle) {
  return this.fen.split(" ")[1] === "b" ? "White" : "Black";
});

puzzleSchema.virtual("opponentSide").get(function (this: Puzzle) {
  return this.fen.split(" ")[1] === "w" ? "White" : "Black";
});

function UCItoMovement(uci: string): Movement {
  const initial = Chess.decode(uci.substr(0, 2));
  const final = Chess.decode(uci.substr(2, 2));
  return { initial, final };
}

export function makeFenMove(fen: string, move: string) {
  const chess = new Chess(fen);
  chess.move(UCItoMovement(move));
  return chess.export();
}

puzzleSchema.virtual("imageUrl").get(function (this: Puzzle) {
  // r2q1rk1/5ppp/1np5/p1b5/2p1B3/P7/1P3PPP/R1BQ1RK1 b - - 1 17
  // r2q1rk1/5ppp/1np5/p1b5/2p1B3/P7/1P3PPP/R1BQ1RK1%20b%20-%20-%201%2017
  const newFen = makeFenMove(this.fen, this.firstMove);
  const encodedFen = newFen.replace(/ /g, "%20");
  const highlighted = this.firstMove;
  const flip = this.playerSide === "Black";
  return `https://www.chess.com/dynboard?fen=${encodedFen}&board=brown&piece=neo&size=3&coordinates=true&highlight_squares=${highlighted}&flip=${flip}`;
});

puzzleSchema.virtual("encodedId").get(function (this: Puzzle) {
  return encode(this._id + " ");
});

export default model<Puzzle>("puzzle", puzzleSchema);

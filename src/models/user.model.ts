import { Document, model, Schema } from "mongoose";

export interface User extends Document<string> {
  burntPoints: number;
}

const userSchema: Schema = new Schema({
  _id: { type: String },
  burntPoints: { type: Number, default: 0 },
});

export default model<User>("user", userSchema);

import { Document, model, Schema } from "mongoose";

export interface Event extends Document {
  name: string;
  organisators: string[];
}

const eventSchema: Schema = new Schema({
  name: { type: String, required: true },
  organisators: { type: [String] },
});

export default model<Event>("event", eventSchema);

import { Document, model, Schema } from "mongoose";

export interface Event extends Document {
  name: string;
}

const eventSchema: Schema = new Schema({
  name: { type: String, required: true },
});

export default model<Event>("event", eventSchema);

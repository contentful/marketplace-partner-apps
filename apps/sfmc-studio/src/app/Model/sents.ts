import mongoose, { Schema } from "mongoose";

export interface ISents extends Document {
  licenseKey: string;
  values: {
    date: Date;
    sents: string;
    campaign: string;
  };
}

// Schema
const SentsSchema = new Schema({
  licenseKey: { type: String },
  values: {
    date: { type: Date },
    sents: { type: String },
    campaign: { type: String },
  },
});

export const Sents =
  mongoose.models.Sents ||
  mongoose.model<ISents & Document>("Sents", SentsSchema);

import mongoose, { Schema } from "mongoose";

export interface IBounce extends Document {
  licenseKey: string;
  values: {
    date: Date;
  };
}

// Schema
const BounceSchema = new Schema({
  licenseKey: { type: String },
  values: {
    date: { type: Date },
  },
});

export const Bounces =
  mongoose.models.Bounces ||
  mongoose.model<IBounce & Document>("Bounces", BounceSchema);

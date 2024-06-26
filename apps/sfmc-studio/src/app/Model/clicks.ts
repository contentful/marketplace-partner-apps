import mongoose, { Schema } from "mongoose";

export interface IClick extends Document {
  licenseKey: string;
  values: {
    date: Date; // 2023-08-31 09:09:24 -06:00
    clicks: string;
    campaign: string;
    isunique: "True"|"False";
  };
}

// Schema
const ClickSchema = new Schema({
  licenseKey: { type: String },
  values: {
    date: { type: Date },
    clicks: { type: String },
    campaign: { type: String },
    isunique: { type: String },
  },
});

export const Clicks =
  mongoose.models.Clicks ||
  mongoose.model<IClick & Document>("Clicks", ClickSchema);

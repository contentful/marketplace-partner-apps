import mongoose, { Schema } from "mongoose";

export interface IOpen extends Document {
  licenseKey: string;
  values: {
    date: Date; //"2023-11-17 16:34:40 -06:00";
    opens: string;
    campaign: string;
    isunique: "True"|"False";
    weekdays: string;
  };
}

// Schema
const OpenSchema = new Schema({
  licenseKey: { type: String },
  values: {
    date: { type: Date },
    opens: { type: String },
    campaign: { type: String },
    isunique: { type: String },
    weekdays: { type: String },
  },
});

export const Opens =
  mongoose.models.Opens || mongoose.model<IOpen & Document>("Opens", OpenSchema);

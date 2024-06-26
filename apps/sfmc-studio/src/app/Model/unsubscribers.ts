import mongoose, { Schema } from "mongoose";

export interface IUnSubscribers extends Document {
  licenseKey: string;
  values: {
    date: Date; //"2023-11-20 14:40:22 -06:00";
  };
}

// Schema
const UnSubscriberSchema = new Schema({
  licenseKey: { type: String },
  values: {
    date: { type: Date },
  },
});

export const UnSubscribers =
  mongoose.models.UnSubscribers ||
  mongoose.model<IUnSubscribers & Document>("UnSubscribers", UnSubscriberSchema);

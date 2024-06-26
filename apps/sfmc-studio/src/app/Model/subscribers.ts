import mongoose, { Schema } from "mongoose";

export interface ISubscribers extends Document {
  licenseKey: string;
  values: {
    date: Date; //"2023-06-02 07:31:00 -06:00";
  };
}

// Schema
const SubscriberSchema = new Schema({
  licenseKey: { type: String },
  values: {
    date: { type: Date },
  },
});

export const Subscribers =
  mongoose.models.Subscribers ||
  mongoose.model<ISubscribers & Document>("Subscribers", SubscriberSchema);

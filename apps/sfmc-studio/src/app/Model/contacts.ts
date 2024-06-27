import mongoose, { Schema } from "mongoose";

export interface IContact extends Document {
  licenseKey: string;
  Id: string;
  CreatedDate: Date; //"2024-01-21T16:33:34.000+0000"
  HasOptedOutOfEmail: boolean,
}

// Schema
const ContactSchema = new Schema({
  licenseKey: { type: String },
  Id: { type: String },
  CreatedDate: { type: Date },
  HasOptedOutOfEmail: { type: Boolean },
});

export const Contact =
  mongoose.models.Contact ||
  mongoose.model<IContact & Document>("Contact", ContactSchema);

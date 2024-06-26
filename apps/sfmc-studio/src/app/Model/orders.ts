import mongoose, { Schema } from "mongoose";

export interface IOrder extends Document {
  licenseKey: string;
  Id: string;
  TotalAmount: number;
  CreatedDate: Date;
  EffectiveDate: Date;
  BillingCity: string;
  Status: string;
  Type: string;
  Account: {
    attributes: {
      type: string;
      url: string;
    };
    AccountSource: string;
  };
  CurrencyIsoCode: string;
}

// Schema
const OrderSchema = new Schema({
  licenseKey: { type: String },
  Id: { type: String },
  TotalAmount: { type: Number },
  CreatedDate: { type: Date },
  EffectiveDate: { type: Date },
  BillingCity: { type: String },
  Status: { type: String },
  Type: { type: String },
  Account: {
    attributes: {
      type: { type: String },
      url: { type: String },
    },
    AccountSource: String,
  },
  CurrencyIsoCode: { type: String, default: "CAD" },
});

export const Order =
  mongoose.models.Order ||
  mongoose.model<IOrder & Document>("Order", OrderSchema);

import mongoose, { Schema } from "mongoose";

export interface IOrderItem extends Document {
  licenseKey: string;
  Id: string;
  TotalPrice: number;
  Quantity: number;
  Product2Id: string;
  Product2: {
    attributes: {
      type: string;
      url: string;
    };
    Name: string;
    DisplayUrl: string;
    StockKeepingUnit: string;
    Family: string;
  };
  Order: {
    attributes: {
      type: string;
      url: string;
    };
    EffectiveDate: Date;
  };
  CreatedDate: Date; // "2024-01-21T09:21:54.000+0000"
  CurrencyIsoCode: string;
}

// Schema
const OrderItemSchema = new Schema({
  licenseKey: { type: String },
  Id: { type: String },
  TotalPrice: { type: Number },
  Quantity: { type: Number },
  Product2Id: { type: String },
  Product2: {
    attributes: {
      type: { type: String },
      url: { type: String },
    },
    Name: { type: String },
    DisplayUrl: { type: String },
    StockKeepingUnit: { type: String },
    Family: { type: String },
  },
  Order: {
    attributes: {
      type: { type: String },
      url: { type: String },
    },
    EffectiveDate: { type: Date },
  },
  CreatedDate: { type: Date },
  CurrencyIsoCode: { type: String, default: "CAD" },
});

export const OrderItem =
  mongoose.models.OrderItem ||
  mongoose.model<IOrderItem & Document>("OrderItem", OrderItemSchema);

import mongoose, { Schema } from "mongoose";

export interface IDashboardConfig extends Document {
  licenseKey: string;
  menulabel: string;
  heading: string;
  order: number;
  link: string;
}

const DashboardConfigSchema = new Schema({
  licenseKey: String,
  menulabel: String,
  heading: String,
  order: { type: Number },
  link: String,
});

export const DashboardConfig =
  mongoose.models.DashboardConfig ||
  mongoose.model<IDashboardConfig & Document>(
    "DashboardConfig",
    DashboardConfigSchema
  );

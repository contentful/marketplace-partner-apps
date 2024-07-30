import mongoose, { Schema } from "mongoose";

export interface IAppCredential extends Document {
  licenseKey: string;
  clientCreds: {
    subdomain: string,
    clientId: string,
    clientSecret: string,
    spaceId: string,
  };
  mid: string;
  dataExtentionIds: {
    SFMC_Studio_Unsubscribers: string;
    SFMC_Studio_Subscribers: string;
    SFMC_Studio_Sents: string;
    SFMC_Studio_Opens: string;
    SFMC_Studio_Clicks: string;
    SFMC_Studio_Bounce: string;
  };
  queryDefinitionIds: {
    SFMC_Studio_Unsubscribers: string;
    SFMC_Studio_Subscribers: string;
    SFMC_Studio_Sents: string;
    SFMC_Studio_Opens: string;
    SFMC_Studio_Clicks: string;
    SFMC_Studio_Bounce: string;
  };
  automationId: string;
}

// Schema
const AppCredentialSchema = new Schema({
  licenseKey: { type: String },
  clientCreds: {
    subdomain: { type: String },
    clientId: { type: String },
    clientSecret: { type: String },
    spaceId: { type: String },
  },
  mid: { type: String },
  dataExtentionIds: {
    SFMC_Studio_Unsubscribers: { type: String },
    SFMC_Studio_Subscribers: { type: String },
    SFMC_Studio_Sents: { type: String },
    SFMC_Studio_Opens: { type: String },
    SFMC_Studio_Clicks: { type: String },
    SFMC_Studio_Bounce: { type: String },
  },
  queryDefinitionIds: {
    SFMC_Studio_Unsubscribers: { type: String },
    SFMC_Studio_Subscribers: { type: String },
    SFMC_Studio_Sents: { type: String },
    SFMC_Studio_Opens: { type: String },
    SFMC_Studio_Clicks: { type: String },
    SFMC_Studio_Bounce: { type: String },
  },
  automationId: { type: String },
});

export const AppCredential =
  mongoose.models.AppCredential ||
  mongoose.model<IAppCredential & Document>(
    "AppCredential",
    AppCredentialSchema
  );

import mongoose from "mongoose";
import {
  eDataExtensionParams,
  eDataExtensionKey,
  eSFMCQueryParams,
  eSFDCQueryParams,
} from "../Constants";
import { Bounces } from "../../Model/bounces";
import { Clicks } from "../../Model/clicks";
import { Opens } from "../../Model/opens";
import { Sents } from "../../Model/sents";
import { Subscribers } from "../../Model/subscribers";
import { UnSubscribers } from "../../Model/unsubscribers";
import { Order } from "@/model/orders";
import { Contact } from "@/model/contacts";
import { OrderItem } from "@/model/orderItems";

const DATABASE_URL: string = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  throw new Error(
    "Please define the DATABASE_URL environment variable inside .env.local"
  );
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(DATABASE_URL, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;

export const dataExtensionsMap: {
  extension: eDataExtensionParams;
  query: eSFMCQueryParams;
  dateField: string;
  dbModel: mongoose.Model<any>;
}[] = [
  {
    extension: eDataExtensionParams.SENTS,
    query: eSFMCQueryParams.SENTS_QUERY,
    dateField: "date",
    dbModel: Sents,
  },
  {
    extension: eDataExtensionParams.BOUNCES,
    query: eSFMCQueryParams.BOUNCES_QUERY,
    dateField: "date",
    dbModel: Bounces,
  },
  {
    extension: eDataExtensionParams.CLICKS,
    query: eSFMCQueryParams.CLICKS_QUERY,
    dateField: "date",
    dbModel: Clicks,
  },
  {
    extension: eDataExtensionParams.OPENS,
    query: eSFMCQueryParams.OPENS_QUERY,
    dateField: "date",
    dbModel: Opens,
  },
  {
    extension: eDataExtensionParams.SUBSCRIBERS,
    query: eSFMCQueryParams.SUBSCRIBERS_QUERY,
    dateField: "date",
    dbModel: Subscribers,
  },
  {
    extension: eDataExtensionParams.UNSUBSCRIBERS,
    query: eSFMCQueryParams.UNSUBSCRIBERS_QUERY,
    dateField: "date",
    dbModel: UnSubscribers,
  },
];

export const dataExtensionCountsKeyMap: {
  extensionKey: eDataExtensionKey;
  dbModel: mongoose.Model<any>;
}[] = [
  {
    extensionKey: eDataExtensionKey.SENTS,
    dbModel: Sents,
  },
  {
    extensionKey: eDataExtensionKey.BOUNCES,
    dbModel: Bounces,
  },
  {
    extensionKey: eDataExtensionKey.OPENS,
    dbModel: Opens,
  },
  {
    extensionKey: eDataExtensionKey.CLICKS,
    dbModel: Clicks,
  },
  {
    extensionKey: eDataExtensionKey.UNIQUE_CLICKS,
    dbModel: Clicks,
  },
  {
    extensionKey: eDataExtensionKey.UNIQUE_OPENS,
    dbModel: Opens,
  },
  {
    extensionKey: eDataExtensionKey.UNSUBSCRIBERS,
    dbModel: UnSubscribers,
  },
];

export const salesCloudCollectionMap = [
  {
    collection: Order,
    param: eSFDCQueryParams.SALES_CLOUD_ORDER_QUERY,
  },
  {
    collection: Contact,
    param: eSFDCQueryParams.SALES_CLOUD_CONTACTS_QUERY,
  },
  {
    collection: OrderItem,
    param: eSFDCQueryParams.SALES_CLOUD_ORDER_ITEM_QUERY,
  },
];

export const deletedCollectionMap = [
  {
    dbModel: Order,
  },
  {
    dbModel: Contact,
  },
  {
    dbModel: OrderItem,
  },
  {
    dbModel: Sents,
  },
  {
    dbModel: Bounces,
  },
  {
    dbModel: Clicks,
  },
  {
    dbModel: Opens,
  },
  {
    dbModel: Subscribers,
  },
  {
    dbModel: UnSubscribers,
  },
];

import { dbInsertionBatchSize } from "../Constants";
import mongoose from "mongoose";

export const insertDocumentsInBatches = async (
  documentsToInsert: any[],
  model: mongoose.Model<any, {}, {}, {}, any, any>
) => {
  for (let i = 0; i < documentsToInsert.length; i += dbInsertionBatchSize) {
    const batch = documentsToInsert.slice(i, i + dbInsertionBatchSize);
    await model.insertMany(batch, { ordered: true });
  }
};

export const deleteDocumentsByModel = async (
  model: mongoose.Model<any, {}, {}, {}, any, any>,
  licenseKeys: string[]
) => {
  await model.deleteMany({ licenseKey: { $in: [...licenseKeys] } });
};

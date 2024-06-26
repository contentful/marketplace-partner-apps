import {
  eDataExtensionParams,
  queryConcurrentConnections,
} from "@/lib/Constants";
import connectDB, { dataExtensionsMap } from "@/lib/helpers/DBHelpers";
import { insertDocumentsInBatches } from "@/lib/helpers/CommonHelpers";
import { DefaultSyncDates, getMoment } from "@/lib/helpers/DateHelpers";
import {
  SFUrlBuilder,
  getDataExtensionParam,
  getSFMCToken,
} from "@/lib/helpers/SalesforceHelpers";
import axios from "axios";
import { NextResponse } from "next/server";
import { queue } from "@/lib/queues/queue";

export const syncMarketingCloudData = async ({
  licenseKey,
  sfmcSubdomain,
  sfmcclientId,
  sfmcclientSecret,
  sfmcTimezone,
}: {
  licenseKey: string;
  sfmcSubdomain: string;
  sfmcclientId: string;
  sfmcclientSecret: string;
  sfmcTimezone: string;
}) => {
  try {
    if (!licenseKey) {
      throw new Error(
        JSON.stringify({
          type: "APIError",
          message: "License Key missing in req body",
        })
      );
    }
    await connectDB();

    const fetchAndSaveMarketingData = async () => {
      try {
        const authToken = await getSFMCToken({
          subdomain: sfmcSubdomain,
          credentials: {
            clientId: sfmcclientId,
            clientSecret: sfmcclientSecret,
          },
        });
        if (!authToken) {
          throw new Error(
            JSON.stringify({
              type: "SF Auth Error",
              message: "Error occured! Check creds for marketing cloud",
            })
          );
        }
        for (const extension of dataExtensionsMap) {
          await fetchApiRecordsAndSave(
            licenseKey,
            {
              clientId: sfmcclientId,
              clientSecret: sfmcclientSecret,
            },
            sfmcSubdomain,
            extension.extension,
            sfmcTimezone
          );
          await new Promise((resolve) => setTimeout(resolve, 10 * 1000)); // 10 seconds delay to adjust sfmc apis rate limit
          console.log(extension.extension, "synced");
        }
        console.log("Marketing Cloud sync finished");
      } catch (error) {
        console.log("Marketing Cloud Sync Error occurred");
      }
    };
    queue.add(() => fetchAndSaveMarketingData());
    return NextResponse.json({ message: "save data" });
  } catch (error) {
    throw new Error(
      JSON.stringify({
        type: "SF API Error",
        message: `Error occured fetching synchronising data from extension`,
      })
    );
  }
};

const fetchApiRecordsAndSave = async (
  licenseKey: string,
  credentials: {
    clientId: string;
    clientSecret: string;
  },
  subdomain: string,
  dataExtParam: eDataExtensionParams,
  sfmcTimezone: string
) => {
  try {
    const getHeader = async () => {
      return {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getSFMCToken({
            subdomain,
            credentials: {
              clientId: credentials.clientId,
              clientSecret: credentials.clientSecret,
            },
          })}`,
        },
      };
    };
    const dataExtension = dataExtensionsMap.find(
      (ext) => ext.extension === dataExtParam
    );

    let lastSyncedRecord = await dataExtension!.dbModel
      .findOne({ licenseKey })
      .sort({ [`values.${dataExtension?.dateField}`]: -1 })
      .limit(1);

    const getStartDate = (lastSyncedRecord: any) => {
      return getMoment(
        lastSyncedRecord.values[dataExtension!.dateField],
        sfmcTimezone
      )
        .subtract(5, "days")
        .startOf("day");
    };

    const startDate = lastSyncedRecord?.values?.[dataExtension!.dateField]
      ? getStartDate(lastSyncedRecord).format("YYYY-MM-DD HH:mm:ss")
      : DefaultSyncDates.marketingCloud(sfmcTimezone).syncStartDate;

    //delete data
    if (lastSyncedRecord) {
      let syncStartDate = getStartDate(lastSyncedRecord).toDate();
      await dataExtension!.dbModel.deleteMany({
        [`values.${dataExtension?.dateField}`]: { $gte: syncStartDate },
        licenseKey: licenseKey,
      });
    }

    const url = `${SFUrlBuilder.getSFMCDataUrl({
      subdomain: subdomain,
      dataExtParam: dataExtParam,
      queryParam: getDataExtensionParam(dataExtParam, {
        startDate: startDate,
        endDate: DefaultSyncDates.marketingCloud(sfmcTimezone).syncEndDate,
      }),
    })}`;

    const initialResponse = await axios.get(
      `${url}&$page=1`,
      await getHeader()
    );
    const totalPages = Math.ceil(
      initialResponse.data.count / initialResponse.data.pageSize
    );

    const fetchDataWithDelay = async (
      pageNumber: number,
      delay: number,
      header: any
    ) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return axios.get(`${url}&$page=${pageNumber}`, header);
    };

    const maxConcurrentRequests = queryConcurrentConnections;

    let currentIndex = 0;
    const sendRequests = async () => {
      while (currentIndex < totalPages) {
        const currentBatch = [];

        //Get header
        const header = await getHeader();

        // Create a batch of documents
        for (
          let i = 0;
          i < maxConcurrentRequests && currentIndex < totalPages;
          i++
        ) {
          currentBatch.push(
            fetchDataWithDelay(++currentIndex, 1000 * 10, header)
          );
        }

        // Wait for all requests in the batch to complete
        const res = await Promise.all(currentBatch);

        // Extract items from responses and create a batch of documents to insert
        const documentsToInsert = res.flatMap((response) =>
          response.data.items.map((elm: any) => {
            return { ...elm, licenseKey };
          })
        );

        // Insert documents in batches
        await insertDocumentsInBatches(
          documentsToInsert,
          dataExtension!.dbModel
        );
      }
    };

    // Send requests with throttling
    await sendRequests();
  } catch (error) {
    console.log(error);
    throw new Error(
      JSON.stringify({
        type: "SF API Error",
        message: `Error occured fetching data from marketing cloud ${dataExtParam} extension`,
      })
    );
  }
};

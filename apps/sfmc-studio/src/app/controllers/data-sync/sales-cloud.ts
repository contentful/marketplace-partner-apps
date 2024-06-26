import { SFUrlBuilder, getSFDCToken } from "@/lib/helpers/SalesforceHelpers";
import axios from "axios";
import { DefaultSyncDates } from "@/lib/helpers/DateHelpers";
import moment from "moment";
import { insertDocumentsInBatches } from "@/lib/helpers/CommonHelpers";
import connectDB, { salesCloudCollectionMap } from "@/lib/helpers/DBHelpers";
import { queue } from "@/lib/queues/queue";

// salesCloud authorization

export const getDCAuthToken = async ({
  baseUrl,
  username,
  password,
  clientId,
  clientSecret,
  licenseKey,
  sfscTimezone,
}: {
  baseUrl: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  licenseKey: string;
  sfscTimezone: string;
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

    const token = await getSFDCToken({
      baseUrl,
      credentials: {
        username,
        password,
        clientId,
        clientSecret,
      },
    });

    if (!token) {
      throw new Error(
        JSON.stringify({
          type: "APIError",
          message: "Token missing",
        })
      );
    }

    await connectDB();

    const fetchAndSaveData = async () => {
      try {
        for (const salesCloud of salesCloudCollectionMap) {
          let EffectiveDateArray = ["orders", "orderitems"];
          let dateField = "CreatedDate";
          let {
            collection: {
              collection: { collectionName },
            },
          } = salesCloud;
          let isEffectiveDate = EffectiveDateArray.includes(collectionName);
          if (isEffectiveDate) {
            dateField =
              collectionName === "orders"
                ? "EffectiveDate"
                : "Order.EffectiveDate";
          }

          const lastObject = await salesCloud.collection
            .findOne({ licenseKey: licenseKey })
            .sort({ [dateField]: -1 })
            .limit(1);

          //helper function for sync date
          const getSyncStartDate = (lastObject: any | undefined) => {
            if (lastObject) {
              if (dateField === "Order.EffectiveDate") {
                // in case of orders or orderItems we are deleting last 10 days data and
                // then syncing so that we are able to approximately fix the order status issue
                return moment(lastObject?.Order?.EffectiveDate)
                  .subtract(10, "days")
                  .startOf("day")
                  .toDate();
              } else {
                if (collectionName === "orders") {
                  // in case of orders or orderItems we are deleting last 10 days data and
                  // then syncing so that we are able to approximately fix the order status issue
                  return moment(lastObject?.[dateField])
                    .subtract(10, "days")
                    .startOf("day")
                    .toDate();
                }
                return lastObject?.[dateField];
              }
            } else {
              //return default sync date
              return DefaultSyncDates.salesCloud(
                collectionName === "contacts" ? "contacts" : "others",
                sfscTimezone
              ).syncStartDate;
            }
          };

          let startDate = getSyncStartDate(lastObject);

          if (lastObject !== null) {
            let date = lastObject?.[dateField];
            if (dateField === "Order.EffectiveDate")
              date = lastObject?.Order?.EffectiveDate;
            let dateValue = new Date(date);
            if (
              collectionName === "orders" ||
              collectionName === "orderitems"
            ) {
              // in case of orders or orderItems we are deleting last 10 days data and
              // then syncing so that we are able to approximately fix the order status issue
              dateValue = moment(date)
                .subtract(10, "days")
                .startOf("day")
                .toDate();
            }
            await salesCloud.collection.deleteMany({
              [dateField]: { $gte: dateValue },
              licenseKey: licenseKey,
            });
          }

          let startDateTime = isEffectiveDate
            ? moment(startDate).format("YYYY-MM-DD")
            : moment(startDate).toISOString();

          let endDateTime = isEffectiveDate
            ? moment.utc().endOf("day").format("YYYY-MM-DD")
            : DefaultSyncDates.salesCloud(
                "contacts",
                sfscTimezone
              ).syncEndDate.toISOString();

          let query = `+WHERE ${dateField} >= ${startDateTime} AND ${dateField} <= ${endDateTime} ORDER BY ${dateField} ASC`;
          let salesData = await getSalesCloudRecords(
            baseUrl,
            token,
            salesCloud.param.concat(query),
            licenseKey
          );
          await insertDocumentsInBatches(salesData, salesCloud.collection);
          console.log(salesCloud?.collection?.modelName, "sync finished");
        }
        console.log("Sales Cloud sync finished");
      } catch (error) {
        console.log("Sales Cloud Sync Error occurred");
      }
    };
    queue.add(() => fetchAndSaveData());
  } catch (err) {
    throw new Error(
      JSON.stringify({
        type: "APIError",
        message: err,
      })
    );
  }
};

const getSalesCloudRecords = async (
  baseUrl: string,
  token: string,
  queryParam: string,
  licenseKey: string
) => {
  let finalData: any = [];

  const initialUrl = SFUrlBuilder.getSFDCDataUrl({
    baseUrl: baseUrl,
    queryParam: queryParam,
  });

  const headers = { headers: { Authorization: "Bearer " + token } };

  let nextUrl = initialUrl;
  let requests: any = [];

  // Fetch initial data
  let initialResponse = await axios.get(nextUrl, headers);
  finalData.push(
    ...initialResponse.data.records.map((el: any) => {
      return { ...el, licenseKey };
    })
  );

  while (!initialResponse.data.done) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 seconds delay
    nextUrl = baseUrl + initialResponse.data.nextRecordsUrl;
    requests.push(axios.get(nextUrl, headers));

    if (requests.length >= 200) {
      // Maximum concurrent requests
      const responses = await Promise.all(requests);
      responses.forEach((response: any) => {
        finalData.push(...response.data.records);
      });
      requests = [];
    }

    initialResponse = await axios.get(nextUrl, headers);
  }

  // Process remaining responses
  if (requests.length > 0) {
    const remainingResponses = await Promise.all(requests);
    remainingResponses.forEach((response: any) => {
      finalData.push(
        ...response.data.records.map((el: any) => {
          return { ...el, licenseKey };
        })
      );
    });
  }

  return finalData;
};

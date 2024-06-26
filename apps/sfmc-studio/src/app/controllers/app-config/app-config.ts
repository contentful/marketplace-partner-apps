import { eDataExtensionStatus } from "@/lib/Constants";
import connectDB, { deletedCollectionMap } from "@/lib/helpers/DBHelpers";
import { SFUrlBuilder, getSFMCToken } from "@/lib/helpers/SalesforceHelpers";
import { AppCredential, IAppCredential } from "@/model/appCredential";
import axios from "axios";
import xmljs from "xml-js";
import { queue } from "@/lib/queues/queue";
import { deleteDocumentsByModel } from "@/lib/helpers/CommonHelpers";

export const configureAutomation = async (requestBody: any) => {
  try {
    await createDataExtension(requestBody);
    await createAutomationQuery(requestBody);
    await performAutomation(requestBody);
    await scheduleAutomation(requestBody);
  } catch (error) {
    console.log("Error occured in configureAutomation", error);
  }
};

export const deleteAutomationConfig = async (requestBody: any) => {
  try {
    /**
     * Deleting Data Extension, Automation Query, Automation
     */
    try {
      await deleteDataExtension(requestBody);
      await deleteQueryDefination(requestBody);
      await deleteAutomation(requestBody);
    } catch (error) {
      console.log("Error occured in deleting SF Queries/Automation/DE", error);
    }

    await deleteLicenseKeyData(requestBody);
  } catch (error) {
    console.log("Error occured in deleteAutomationConfig", error);
  }
};

export const updateClientCreds = async (requestBody: any) => {
  try {
    const clientCreds = {
      subdomain: requestBody?.subdomain,
      clientId: requestBody?.client_id,
      clientSecret: requestBody?.client_secret,
      spaceId: requestBody?.spaceId,
    };
    await connectDB();

    const res = await AppCredential.updateOne(
      { licenseKey: requestBody?.licenseKey },
      {
        $set: {
          clientCreds: clientCreds,
          mid: requestBody?.mid,
        },
      },
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.log("Error occured in saveUserCreds", err);
  }
};

//**  Creating Data Extension in SFMC */
export const createDataExtension = async (requestBody: any) => {
  try {
    // Create Data Extension
    let data = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <s:Header>
        <a:Action s:mustUnderstand="1">Create</a:Action>
        <a:To s:mustUnderstand="1">${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}</a:To>
        <fueloauth xmlns="http://exacttarget.com">${
          requestBody.access_token
        }</fueloauth>
    </s:Header>
    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
            <Objects xsi:type="DataExtension">
                <Client>
                    <ID>${requestBody.mid}</ID>
                </Client>
                <CustomerKey>SFMC_Studio_Bounce</CustomerKey>
                <Name>SFMC_Studio_Bounce</Name>
                <IsSendable>false</IsSendable>
                <Fields>
                    <Field>
                        <CustomerKey>subscriber_key</CustomerKey>
                        <Name>subscriber_key</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                     <Field>
                        <CustomerKey>date</CustomerKey>
                        <Name>date</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                </Fields>
            </Objects>
            <Objects xsi:type="DataExtension">
                <Client>
                    <ID>${requestBody.mid}</ID>
                </Client>
                <CustomerKey>SFMC_Studio_Clicks</CustomerKey>
                <Name>SFMC_Studio_Clicks</Name>
                <IsSendable>false</IsSendable>
                <Fields>
                    <Field>
                        <CustomerKey>subscriber_key</CustomerKey>
                        <Name>subscriber_key</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                     <Field>
                        <CustomerKey>date</CustomerKey>
                        <Name>date</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                    <Field>
                        <CustomerKey>clicks</CustomerKey>
                        <Name>clicks</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                    <Field>
                        <CustomerKey>campaign</CustomerKey>
                        <Name>campaign</Name>
                        <FieldType>Text</FieldType>
                        <MaxLength>1000</MaxLength>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                    <Field>
                        <CustomerKey>isUnique</CustomerKey>
                        <Name>isUnique</Name>
                        <FieldType>Boolean</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                </Fields>
            </Objects>
            <Objects xsi:type="DataExtension">
                <Client>
                    <ID>${requestBody.mid}</ID>
                </Client>
                <CustomerKey>SFMC_Studio_Opens</CustomerKey>
                <Name>SFMC_Studio_Opens</Name>
                <IsSendable>false</IsSendable>
                <Fields>
                    <Field>
                        <CustomerKey>subscriber_key</CustomerKey>
                        <Name>subscriber_key</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                     <Field>
                        <CustomerKey>date</CustomerKey>
                        <Name>date</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                    <Field>
                        <CustomerKey>opens</CustomerKey>
                        <Name>opens</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                    <Field>
                        <CustomerKey>campaign</CustomerKey>
                        <Name>campaign</Name>
                        <FieldType>Text</FieldType>
                        <MaxLength>1000</MaxLength>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                    <Field>
                        <CustomerKey>isUnique</CustomerKey>
                        <Name>isUnique</Name>
                        <FieldType>Boolean</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                    <Field>
                        <CustomerKey>weekdays</CustomerKey>
                        <Name>weekdays</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                </Fields>
            </Objects>
            <Objects xsi:type="DataExtension">
                <Client>
                    <ID>${requestBody.mid}</ID>
                </Client>
                <CustomerKey>SFMC_Studio_Sents</CustomerKey>
                <Name>SFMC_Studio_Sents</Name>
                <IsSendable>false</IsSendable>
                <Fields>
                    <Field>
                        <CustomerKey>subscriber_key</CustomerKey>
                        <Name>subscriber_key</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                     <Field>
                        <CustomerKey>date</CustomerKey>
                        <Name>date</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                    <Field>
                        <CustomerKey>sents</CustomerKey>
                        <Name>sents</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                    <Field>
                        <CustomerKey>campaign</CustomerKey>
                        <Name>campaign</Name>
                        <FieldType>Text</FieldType>
                        <MaxLength>1000</MaxLength>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                </Fields>
            </Objects>
             <Objects xsi:type="DataExtension">
                <Client>
                    <ID>${requestBody.mid}</ID>
                </Client>
                <CustomerKey>SFMC_Studio_Subscribers</CustomerKey>
                <Name>SFMC_Studio_Subscribers</Name>
                <IsSendable>false</IsSendable>
                <Fields>
                    <Field>
                        <CustomerKey>subscriber_key</CustomerKey>
                        <Name>subscriber_key</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                     <Field>
                        <CustomerKey>date</CustomerKey>
                        <Name>date</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                </Fields>
            </Objects>
             <Objects xsi:type="DataExtension">
                <Client>
                    <ID>${requestBody.mid}</ID>
                </Client>
                <CustomerKey>SFMC_Studio_Unsubscribers</CustomerKey>
                <Name>SFMC_Studio_Unsubscribers</Name>
                <IsSendable>false</IsSendable>
                <Fields>
                    <Field>
                        <CustomerKey>subscriber_key</CustomerKey>
                        <Name>subscriber_key</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                     <Field>
                        <CustomerKey>date</CustomerKey>
                        <Name>date</Name>
                        <FieldType>Text</FieldType>
                        <IsRequired>false</IsRequired>
                        <IsPrimaryKey>false</IsPrimaryKey>
                    </Field>
                </Fields>
            </Objects>
        </CreateRequest>
    </s:Body>
</s:Envelope>
`;

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${SFUrlBuilder.getSFMCSoapServiceUrl({
        subdomain: requestBody.subdomain,
      })}`,
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
      },
      data: data,
    };

    const res = await axios.request(config);
    const jsonData = xmljs.xml2json(res.data, { compact: true, spaces: 2 });
    const json = JSON.parse(jsonData);

    let result = json?.["soap:Envelope"]?.["soap:Body"]?.["CreateResponse"];
    let dataExtentionObject: any = getRequiredDataIDs(result);
    if (dataExtentionObject && Object.keys(dataExtentionObject)?.length) {
      await connectDB();

      // checking if credential exits with same license key
      // if does not exit we are save license key as well and update dataExtentionIds

      let appCredential = await AppCredential.findOne({
        licenseKey: requestBody?.licenseKey,
      });

      if (!appCredential) {
        let createDataExt = new AppCredential({
          licenseKey: requestBody?.licenseKey,
          mid: requestBody?.mid,
          dataExtentionIds: dataExtentionObject,
        });

        await createDataExt.save();
      } else {
        // this scenario is used to update or insert the dataExtensionIds
        // (in case dataExtensionIds are updated or created) for particular mid
        await AppCredential.updateMany(
          { mid: requestBody?.mid },
          {
            $set: {
              dataExtentionIds: dataExtentionObject,
            },
          }
        );
      }
    } else {
      let licenseKeyExists = await AppCredential.findOne({
        licenseKey: requestBody?.licenseKey,
      });
      if (
        licenseKeyExists &&
        Object.keys(licenseKeyExists.dataExtentionIds).length &&
        Object.keys(licenseKeyExists.queryDefinitionIds).length &&
        licenseKeyExists.automationId
      )
        return;

      // this scenario is used if data extension is already created at SFMC
      // and there are no DE ids returned and license key doesnt in db.
      let appCredential = await AppCredential.findOne({
        mid: requestBody?.mid,
      });

      if (appCredential) {
        // Here we create a new entry for license key
        // with exiting credentials found in db for same mid
        let check = await AppCredential.updateOne(
          { licenseKey: requestBody?.licenseKey },
          {
            $set: {
              mid: appCredential?.mid,
              dataExtentionIds: appCredential?.dataExtentionIds,
              queryDefinitionIds: appCredential?.queryDefinitionIds,
              automationId: appCredential?.automationId,
            },
          },
          {
            upsert: true,
          }
        );
      } else {
        console.log(
          "Error occured DE ids not returned & appCredentials for mid not found in DB"
        );
      }
    }
    return json;
  } catch (err) {
    console.log("Error occured in createDataExtension", err);
  }
};

//**  Creating Query for fetching data from data extension */
export const createAutomationQuery = async (requestBody: any) => {
  try {
    // Create Automation Query
    let data = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <s:Header>
        <a:Action s:mustUnderstand="1">Create</a:Action>
        <a:To s:mustUnderstand="1">${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}</a:To>
        <fueloauth xmlns="http://exacttarget.com">${
          requestBody.access_token
        }</fueloauth>
    </s:Header>
    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
            <Objects xsi:type="QueryDefinition">
                <CustomerKey>SFMC_Studio_Bounce</CustomerKey>
                <Name>SFMC_Studio_Bounce</Name>
                <QueryText>
                  SELECT TOP 10000000000000000
                    SubscriberKey AS subscriber_key,
                    CONVERT(DATETIME2(0), EventDate) AT TIME ZONE 'Central America Standard Time' AS date
                FROM
                    _BOUNCE
                ORDER BY 
                    CONVERT(DATETIME2(0), EventDate) AT TIME ZONE 'Central America Standard Time' ASC
                </QueryText>
                <TargetType>DE</TargetType>
                <DataExtensionTarget>
                    <CustomerKey>SFMC_Studio_Bounce</CustomerKey>
                    <Name>SFMC_Studio_Bounce</Name>
                </DataExtensionTarget>
                <TargetUpdateType>Overwrite</TargetUpdateType>
            </Objects>
            <Objects xsi:type="QueryDefinition">
                <CustomerKey>SFMC_Studio_Clicks</CustomerKey>
                <Name>SFMC_Studio_Clicks</Name>
                <QueryText>
                  SELECT TOP 100000000000000
                    c.SubscriberKey AS subscriber_key,
                    CONVERT(DATETIME2(0), c.EventDate) AT TIME ZONE 'Central America Standard Time' AS date,
                    c.IsUnique AS isUnique,
                    j.EmailName as campaign,
                    COUNT(c.SubscriberKey) AS clicks
                FROM
                    _CLICK c
                LEFT JOIN _Job j on j.jobID = c.jobID
                GROUP BY 
                     j.EmailName,
                     c.SubscriberKey,
                     CONVERT(DATETIME2(0), c.EventDate) AT TIME ZONE 'Central America Standard Time',
                     c.IsUnique
                ORDER BY
                    CONVERT(DATETIME2(0), EventDate) AT TIME ZONE 'Central America Standard Time' ASC
                </QueryText>
                <TargetType>DE</TargetType>
                <DataExtensionTarget>
                    <CustomerKey>SFMC_Studio_Clicks</CustomerKey>
                    <Name>SFMC_Studio_Clicks</Name>
                </DataExtensionTarget>
                <TargetUpdateType>Overwrite</TargetUpdateType>
            </Objects>
            <Objects xsi:type="QueryDefinition">
                <CustomerKey>SFMC_Studio_Sents</CustomerKey>
                <Name>SFMC_Studio_Sents</Name>
                <QueryText>
                  SELECT TOP 10000000000000000
                    s.SubscriberKey AS subscriber_key,
                    CONVERT(DATETIME2(0), s.EventDate) AT TIME ZONE 'Central America Standard Time' AS date,
                    COUNT(s.SubscriberKey) AS sents,
                    j.EmailName AS campaign
                FROM
                    _SENT AS s
                LEFT JOIN
                    _Job AS j
                ON 
                    j.JobID = s.JobID
                GROUP BY
                    j.EmailName,
                    CONVERT(DATETIME2(0), s.EventDate) AT TIME ZONE 'Central America Standard Time',
                    s.SubscriberKey
                ORDER BY 
                    CONVERT(DATETIME2(0), EventDate) AT TIME ZONE 'Central America Standard Time' ASC
                </QueryText>
                <TargetType>DE</TargetType>
                <DataExtensionTarget>
                    <CustomerKey>SFMC_Studio_Sents</CustomerKey>
                    <Name>SFMC_Studio_Sents</Name>
                </DataExtensionTarget>
                <TargetUpdateType>Overwrite</TargetUpdateType>
            </Objects>
            <Objects xsi:type="QueryDefinition">
                <CustomerKey>SFMC_Studio_Opens</CustomerKey>
                <Name>SFMC_Studio_Opens</Name>
                <QueryText>
                  SELECT TOP 100000000000000
                    o.SubscriberKey AS subscriber_key,
                    CONVERT(DATETIME2(0), o.EventDate) AT TIME ZONE 'Central America Standard Time' AS date,
                    o.IsUnique AS isUnique,
                    DATEPART(dw, o.EventDate) as weekdays,
                    j.EmailName AS campaign,
                    COUNT(o.SubscriberKey) AS opens
                    
                FROM
                    _OPEN AS o
                LEFT JOIN
                    _Job AS j
                    ON j.JobID = o.JobID
                GROUP BY
                    j.EmailName,
                    o.SubscriberKey,
                    CONVERT(DATETIME2(0), o.EventDate) AT TIME ZONE 'Central America Standard Time',
                    o.IsUnique,
                    DATEPART(dw, o.EventDate)
                    
                ORDER BY
                    CONVERT(DATETIME2(0), EventDate) AT TIME ZONE 'Central America Standard Time' ASC
                </QueryText>
                <TargetType>DE</TargetType>
                <DataExtensionTarget>
                    <CustomerKey>SFMC_Studio_Opens</CustomerKey>
                    <Name>SFMC_Studio_Opens</Name>
                </DataExtensionTarget>
                <TargetUpdateType>Overwrite</TargetUpdateType>
            </Objects>
            <Objects xsi:type="QueryDefinition">
                <CustomerKey>SFMC_Studio_Subscribers</CustomerKey>
                <Name>SFMC_Studio_Subscribers</Name>
                <QueryText>
                   SELECT TOP 10000000000000000
                    SubscriberKey AS subscriber_key,
                    CONVERT(DATETIME2(0), DateJoined) AT TIME ZONE 'Central America Standard Time' AS date
                FROM
                    _Subscribers
                ORDER BY 
                    CONVERT(DATETIME2(0), DateJoined) AT TIME ZONE 'Central America Standard Time' ASC
                </QueryText>
                <TargetType>DE</TargetType>
                <DataExtensionTarget>
                    <CustomerKey>SFMC_Studio_Subscribers</CustomerKey>
                    <Name>SFMC_Studio_Subscribers</Name>
                </DataExtensionTarget>
                <TargetUpdateType>Overwrite</TargetUpdateType>
            </Objects>
            <Objects xsi:type="QueryDefinition">
                <CustomerKey>SFMC_Studio_Unsubscribers</CustomerKey>
                <Name>SFMC_Studio_Unsubscribers</Name>
                <QueryText>
                    SELECT TOP 10000000000000000
                    SubscriberKey AS subscriber_key,
                    CONVERT(DATETIME2(0), EventDate) AT TIME ZONE 'Central America Standard Time' AS date
                FROM
                    _UNSUBSCRIBE
                ORDER BY 
                    CONVERT(DATETIME2(0), EventDate) AT TIME ZONE 'Central America Standard Time' ASC
                </QueryText>
                <TargetType>DE</TargetType>
                <DataExtensionTarget>
                    <CustomerKey>SFMC_Studio_Unsubscribers</CustomerKey>
                    <Name>SFMC_Studio_Unsubscribers</Name>
                </DataExtensionTarget>
                <TargetUpdateType>Overwrite</TargetUpdateType>
            </Objects>
        </CreateRequest>
    </s:Body>
</s:Envelope>`;

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${SFUrlBuilder.getSFMCSoapServiceUrl({
        subdomain: requestBody.subdomain,
      })}`,
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
      },
      data: data,
    };

    const res = await axios.request(config);
    const jsonData = xmljs.xml2json(res.data, { compact: true, spaces: 2 });
    const json = JSON.parse(jsonData);

    let result = json?.["soap:Envelope"]?.["soap:Body"]?.["CreateResponse"];
    let queryObject: any = getRequiredDataIDs(result);
    if (queryObject && Object.keys(queryObject)?.length) {
      await connectDB();
      await AppCredential.updateMany(
        { mid: requestBody.mid },
        { $set: { queryDefinitionIds: queryObject } }
      );
    }
    return json;
  } catch (err) {
    console.log("Error occured in create automation query", err);
  }
};

//** Creating CTR Query for  fetching CTR data from data extension */
export const createCtrAutomationQuery = async (requestBody: any) => {
  try {
    // Create Ctr Automation Query
    let data = `<?xml version="1.0" encoding="UTF-8"?>
        <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
            <s:Header>
                <a:Action s:mustUnderstand="1">Create</a:Action>
                <a:To s:mustUnderstand="1">${SFUrlBuilder.getSFMCSoapServiceUrl(
                  { subdomain: requestBody.subdomain }
                )}</a:To>
                <fueloauth xmlns="http://exacttarget.com">${
                  requestBody.access_token
                }</fueloauth>
            </s:Header>
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
                <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
                    <Objects xsi:type="QueryDefinition">
                        <CustomerKey>contenful_ctr</CustomerKey>
                        <Name>contenful_ctr</Name>
                        <QueryText>
                        SELECT
                        CASE 
                            WHEN Total_Bounce = 0 THEN 0 
                            ELSE (Total_Bounce /Total_Click ) 
                        END as CTR_Percentage
                                FROM
                        (
                            SELECT
                                SUM(CASE WHEN c.SubscriberKey IS NOT NULL THEN 1 ELSE 0 END) as Total_Click,
                                SUM(CASE WHEN s.SubscriberKey IS NOT NULL THEN 1 ELSE 0 END) as Total_Bounce
                            FROM
                                contenful_deliveries s
                            LEFT JOIN
                                contenful_dataview_click c
                            ON
                                s.JobID = c.JobID
                                AND s.SubscriberKey = c.SubscriberKey
                        ) as subquery
                        </QueryText>
                        <TargetType>DE</TargetType>
                        <DataExtensionTarget>
                            <CustomerKey>contenful_ctr</CustomerKey>
                            <Name>contenful_ctr</Name>
                        </DataExtensionTarget>
                        <TargetUpdateType>Overwrite</TargetUpdateType>
                    </Objects>
                    <Objects xsi:type="QueryDefinition">
                        <CustomerKey>contenful_unique_click</CustomerKey>
                        <Name>contenful_unique_click</Name>
                        <QueryText>SELECT * FROM contenful_dataview_click</QueryText>
                        <TargetType>DE</TargetType>
                        <DataExtensionTarget>
                            <CustomerKey>contenful_unique_click</CustomerKey>
                            <Name>contenful_unique_click</Name>
                        </DataExtensionTarget>
                        <TargetUpdateType>Overwrite</TargetUpdateType>
                    </Objects>
                    <Objects xsi:type="QueryDefinition">
                        <CustomerKey>contenful_unique_open</CustomerKey>
                        <Name>contenful_unique_open</Name>
                        <QueryText>SELECT * FROM contenful_dataview_open</QueryText>
                        <TargetType>DE</TargetType>
                        <DataExtensionTarget>
                            <CustomerKey>contenful_unique_open</CustomerKey>
                            <Name>contenful_unique_open</Name>
                        </DataExtensionTarget>
                        <TargetUpdateType>Overwrite</TargetUpdateType>
                    </Objects>
                </CreateRequest>
            </s:Body>
        </s:Envelope>`;

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${SFUrlBuilder.getSFMCSoapServiceUrl({
        subdomain: requestBody.subdomain,
      })}`,
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
      },
      data: data,
    };

    const res = await axios.request(config);
    const jsonData = xmljs.xml2json(res.data, { compact: true, spaces: 2 });
    const json = JSON.parse(jsonData);

    let result = json?.["soap:Envelope"]?.["soap:Body"]?.["CreateResponse"];
    let queryObject: any = getRequiredDataIDs(result);

    if (queryObject && Object.keys(queryObject)?.length) {
      await connectDB();
      let { queryDefinitionIds } = await AppCredential.findOne({
        mid: requestBody.mid,
      });

      await AppCredential.updateMany(
        { mid: requestBody.mid },
        {
          $set: {
            queryDefinitionIds: { ...queryDefinitionIds, ...queryObject },
          },
        }
      );
    }

    return json;
  } catch (err) {
    console.log("Error occured in create ctr automation query");
  }
};

//** Create/Save automation details to update data in dataextension in automated way */
export const createAutomation = async (requestBody: any) => {
  try {
    await connectDB();
    let appCredential: IAppCredential | null = await AppCredential.findOne({
      mid: requestBody?.mid,
    });

    if (appCredential) {
      let { queryDefinitionIds } = appCredential;
      // Create Automation
      let data = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <s:Header>
        <a:Action s:mustUnderstand="1">Create</a:Action>
        <a:To s:mustUnderstand="1">${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}</a:To>
        <fueloauth xmlns="http://exacttarget.com">${
          requestBody.access_token
        }</fueloauth>
    </s:Header>
    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <CreateRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
            <Objects xsi:type="Automation">
                <Name>SFMC_Studio_Automation</Name>
                <CustomerKey>SFMC_Studio_Automation</CustomerKey>
                <AutomationTasks>
                    <AutomationTask>
                        <Name>SFMC_Studio_Automation</Name>
                        <Activities>
                            <Activity>
                                <ActivityObject xsi:type="QueryDefinition">
                                    <ObjectID>${
                                      queryDefinitionIds.SFMC_Studio_Bounce
                                    }</ObjectID>
                                    <CustomerKey>SFMC_Studio_Bounce</CustomerKey>
                                    <Name>SFMC_Studio_Bounce</Name>
                                </ActivityObject>
                            </Activity>
                            <Activity>
                                <ActivityObject xsi:type="QueryDefinition">
                                    <ObjectID>${
                                      queryDefinitionIds.SFMC_Studio_Clicks
                                    }</ObjectID>
                                    <CustomerKey>SFMC_Studio_Clicks</CustomerKey>
                                    <Name>SFMC_Studio_Clicks</Name>
                                </ActivityObject>
                            </Activity>
                            <Activity>
                                <ActivityObject xsi:type="QueryDefinition">
                                    <ObjectID>${
                                      queryDefinitionIds.SFMC_Studio_Opens
                                    }</ObjectID>
                                    <CustomerKey>SFMC_Studio_Opens</CustomerKey>
                                    <Name>SFMC_Studio_Opens</Name>
                                </ActivityObject>
                            </Activity>
                            <Activity>
                                <ActivityObject xsi:type="QueryDefinition">
                                    <ObjectID>${
                                      queryDefinitionIds.SFMC_Studio_Sents
                                    }</ObjectID>
                                    <CustomerKey>SFMC_Studio_Sents</CustomerKey>
                                    <Name>SFMC_Studio_Sents</Name>
                                </ActivityObject>
                            </Activity>
                            <Activity>
                                <ActivityObject xsi:type="QueryDefinition">
                                    <ObjectID>${
                                      queryDefinitionIds.SFMC_Studio_Subscribers
                                    }</ObjectID>
                                    <CustomerKey>SFMC_Studio_Subscribers</CustomerKey>
                                    <Name>SFMC_Studio_Subscribers</Name>
                                </ActivityObject>
                            </Activity>
                            <Activity>
                                <ActivityObject xsi:type="QueryDefinition">
                                    <ObjectID>${
                                      queryDefinitionIds.SFMC_Studio_Unsubscribers
                                    }</ObjectID>
                                    <CustomerKey>SFMC_Studio_Unsubscribers</CustomerKey>
                                    <Name>SFMC_Studio_Unsubscribers</Name>
                                </ActivityObject>
                            </Activity>
                        </Activities>
                    </AutomationTask>
                </AutomationTasks>
                <AutomationType>scheduled</AutomationType>
            </Objects>
        </CreateRequest>
    </s:Body>
</s:Envelope>`;

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}`,
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
        data: data,
      };

      const res = await axios.request(config);
      const jsonData = xmljs.xml2json(res.data, { compact: true, spaces: 2 });

      const json = JSON.parse(jsonData);
      let result = json?.["soap:Envelope"]?.["soap:Body"]?.["CreateResponse"];
      await AppCredential.updateMany(
        { mid: requestBody.mid },
        {
          $set: {
            automationId:
              result?.["Results"]?.["Object"]?.["ObjectID"]?.["_text"],
          },
        }
      );

      return json;
    }
  } catch (err) {
    console.log("Error occured in create automation ");
  }
};

// ** Perform Data sync to data extension with help of automation  query */
export const performAutomation = async (requestBody: any) => {
  try {
    await connectDB();
    let appCredentials: IAppCredential | null = await AppCredential.findOne({
      mid: requestBody.mid,
    });
    if (!appCredentials?.automationId) {
      await createAutomation(requestBody);

      // Perform Automation
      let data = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <s:Header>
        <a:Action s:mustUnderstand="1">Perform</a:Action>
        <a:To s:mustUnderstand="1">${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}</a:To>
        <fueloauth xmlns="http://exacttarget.com">${
          requestBody.access_token
        }</fueloauth>
    </s:Header>
    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <PerformRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI" xmlns:ns2="urn:fault.partner.exacttarget.com">
            <Action>start</Action>
            <Definitions>
                <Definition xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="Automation">
                    <CustomerKey>SFMC_Studio_Automation</CustomerKey>
                </Definition>
            </Definitions>
        </PerformRequestMsg>
    </s:Body>
</s:Envelope>`;

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}`,
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
        data: data,
      };

      const res = await axios.request(config);
      const jsonData = xmljs.xml2json(res.data, { compact: true, spaces: 2 });
      const json = JSON.parse(jsonData);
      return json;
    } else
      throw new Error(
        "Error occured performing Automation/Automation already performed"
      );
  } catch (err: any) {
    throw new Error(err);
  }
};

//** Scheduling data sync in every given time */
export const scheduleAutomation = async (requestBody: any) => {
  try {
    await connectDB();
    let appCredentials: IAppCredential | null = await AppCredential.findOne({
      mid: requestBody.mid,
    });

    if (appCredentials?.automationId !== null) {
      // Schedule Automation
      let data = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <s:Header>
        <a:Action s:mustUnderstand="1">Schedule</a:Action>
        <a:To s:mustUnderstand="1">${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}</a:To>
        <fueloauth xmlns="http://exacttarget.com">${
          requestBody.access_token
        }</fueloauth>
    </s:Header>
    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <ScheduleRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">
            <Action>start</Action>
            <Schedule>
                <Recurrence xsi:type="HourlyRecurrence">
                    <HourlyRecurrencePatternType>Interval</HourlyRecurrencePatternType>
                    <HourInterval>24</HourInterval>
                </Recurrence>
                <RecurrenceType>Hourly</RecurrenceType>
                <RecurrenceRangeType>EndOn</RecurrenceRangeType>
                <StartDateTime>2019-03-25T20:53:23.2236156-03:00</StartDateTime>
                <EndDateTime>2100-03-25T20:53:23.2236156-03:00</EndDateTime>
            </Schedule>
            <Interactions>
                <Interaction xsi:type="Automation">
                    <CustomerKey>SFMC_Studio_Automation</CustomerKey>
                </Interaction>
            </Interactions>
        </ScheduleRequestMsg>
    </s:Body>
</s:Envelope>`;

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}`,
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
        data: data,
      };

      const res = await axios.request(config);
      const jsonData = xmljs.xml2json(res.data, { compact: true, spaces: 2 });
      const json = JSON.parse(jsonData);

      return json;
    }
  } catch (err: any) {
    throw new Error(err);
  }
};

export const processAppUninstallationWebhook = async (spaceId: string) => {
  try {
    let existingSpaceIdDocument: IAppCredential | null =
      await AppCredential.findOne({
        "clientCreds.spaceId": spaceId,
      });
    if (existingSpaceIdDocument) {
      //* Delete automation config from SFMC
      let {
        licenseKey,
        clientCreds: { clientId, clientSecret, subdomain },
        mid,
      } = existingSpaceIdDocument;
      let access_token = await getSFMCToken({
        subdomain: subdomain,
        credentials: {
          clientId,
          clientSecret,
        },
      });
      const reqBody = { mid, subdomain, access_token, licenseKey };
      await deleteAutomationConfig(reqBody);
    } else {
      console.log("SpaceId not found for processing uninstall webhook");
    }
  } catch (error) {
    console.log("Error occured processing uninstall webhook");
  }
};

//**  Common function to creating obj key pair from api response */
export const getRequiredDataIDs = (result: any) => {
  let dataExtentionObject: { [key: string]: string } = {};

  if (result?.["OverallStatus"]?.["_text"] === eDataExtensionStatus.OK) {
    result?.["Results"]?.forEach((elm: any) => {
      let { Object } = elm;
      if (
        Object &&
        Object?.CustomerKey &&
        Object?.CustomerKey?._text &&
        Object?.ObjectID &&
        Object?.ObjectID?._text
      ) {
        dataExtentionObject[Object.CustomerKey._text] = Object.ObjectID._text;
      }
    });

    return dataExtentionObject;
  }
};

//** Deleting data extension and removed from DB also */
export const deleteDataExtension = async (requestBody: any) => {
  try {
    await connectDB();
    let extensionRes: IAppCredential | null = await AppCredential.findOne({
      mid: requestBody.mid,
    });

    if (extensionRes) {
      let { dataExtentionIds } = extensionRes;

      let data = `<?xml version="1.0" encoding="UTF-8"?>
    <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <s:Header>
        <a:Action s:mustUnderstand="1">Delete</a:Action>
        <a:To s:mustUnderstand="1">${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}</a:To>
        <fueloauth xmlns="http://exacttarget.com">${
          requestBody.access_token
        }</fueloauth>
    </s:Header>
    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
      <DeleteRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
         <Options></Options>
         <Objects xsi:type="DataExtension">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${dataExtentionIds.SFMC_Studio_Bounce}</ObjectID>
            <CustomerKey>SFMC_Studio_Bounce</CustomerKey>
         </Objects>
         <Objects xsi:type="DataExtension">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${dataExtentionIds.SFMC_Studio_Clicks}</ObjectID>
            <CustomerKey>SFMC_Studio_Clicks</CustomerKey>
         </Objects>
         <Objects xsi:type="DataExtension">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${dataExtentionIds.SFMC_Studio_Sents}</ObjectID>
            <CustomerKey>SFMC_Studio_Sents</CustomerKey>
         </Objects>
         <Objects xsi:type="DataExtension">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${dataExtentionIds.SFMC_Studio_Unsubscribers}</ObjectID>
            <CustomerKey>SFMC_Studio_Unsubscribers</CustomerKey>
         </Objects>
         <Objects xsi:type="DataExtension">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${dataExtentionIds.SFMC_Studio_Subscribers}</ObjectID>
            <CustomerKey>SFMC_Studio_Subscribers</CustomerKey>
         </Objects>
         <Objects xsi:type="DataExtension">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${dataExtentionIds.SFMC_Studio_Opens}</ObjectID>
            <CustomerKey>SFMC_Studio_Opens</CustomerKey>
         </Objects>
      </DeleteRequest>
    </s:Body>
</s:Envelope>
`;

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}`,
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
        data: data,
      };

      const res = await axios.request(config);
      const jsonData = xmljs.xml2json(res.data, {
        compact: true,
        spaces: 2,
      });
      const json = JSON.parse(jsonData);
      let result = json["soap:Envelope"]["soap:Body"]["DeleteResponse"];

      if (result?.["OverallStatus"]?.["_text"] === eDataExtensionStatus.OK) {
        await AppCredential.updateMany(
          { mid: requestBody.mid },
          { $set: { dataExtentionIds: {} } }
        );
      }

      return json;
    } else throw "Record not found for Mid";
  } catch (err) {
    console.log("Error occured in delete data extension", err);
  }
};

//** Deleting queryDefinitionIds from DB  and SFMC end  */
export const deleteQueryDefination = async (requestBody: any) => {
  try {
    await connectDB();
    let extensionRes: IAppCredential | null = await AppCredential.findOne({
      mid: requestBody.mid,
    });

    if (extensionRes) {
      let { queryDefinitionIds } = extensionRes;

      let data = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <s:Header>
        <a:Action s:mustUnderstand="1">Delete</a:Action>
        <a:To s:mustUnderstand="1">${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}</a:To>
        <fueloauth xmlns="http://exacttarget.com">${
          requestBody.access_token
        }</fueloauth>
    </s:Header>
    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
      <DeleteRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
         <Options></Options>
        <Objects xsi:type="QueryDefinition">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${queryDefinitionIds.SFMC_Studio_Bounce}</ObjectID>
            <CustomerKey>SFMC_Studio_Bounce</CustomerKey>
         </Objects>
         <Objects xsi:type="QueryDefinition">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${queryDefinitionIds.SFMC_Studio_Clicks}</ObjectID>
            <CustomerKey>SFMC_Studio_Clicks</CustomerKey>
         </Objects>
         <Objects xsi:type="QueryDefinition">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${queryDefinitionIds.SFMC_Studio_Opens}</ObjectID>
            <CustomerKey>SFMC_Studio_Opens</CustomerKey>
         </Objects>
         <Objects xsi:type="QueryDefinition">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${queryDefinitionIds.SFMC_Studio_Sents}</ObjectID>
            <CustomerKey>SFMC_Studio_Sents</CustomerKey>
         </Objects>
         <Objects xsi:type="QueryDefinition">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${queryDefinitionIds.SFMC_Studio_Subscribers}</ObjectID>
            <CustomerKey>SFMC_Studio_Subscribers</CustomerKey>
         </Objects>
         <Objects xsi:type="QueryDefinition">
            <PartnerKey xsi:nil="true"></PartnerKey>
            <ObjectID>${queryDefinitionIds.SFMC_Studio_Unsubscribers}</ObjectID>
            <CustomerKey>SFMC_Studio_Unsubscribers</CustomerKey>
         </Objects>
      </DeleteRequest>
    </s:Body>
</s:Envelope>
`;

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}`,
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
        data: data,
      };

      const res = await axios.request(config);
      const jsonData = xmljs.xml2json(res.data, {
        compact: true,
        spaces: 2,
      });
      const json = JSON.parse(jsonData);
      let result = json["soap:Envelope"]["soap:Body"]["DeleteResponse"];

      if (result?.["OverallStatus"]?.["_text"] === eDataExtensionStatus.OK) {
        await AppCredential.updateMany(
          { mid: requestBody.mid },
          { $set: { queryDefinitionIds: {} } }
        );
      }

      return json;
    } else throw "Record not found for Mid";
  } catch (err) {
    console.log("Error occured in delete data extension", err);
  }
};

//** Deleting automationId from DB and SFMC end  */
export const deleteAutomation = async (requestBody: any) => {
  try {
    await connectDB();
    let automationRes: IAppCredential | null = await AppCredential.findOne({
      mid: requestBody.mid,
    });
    if (automationRes) {
      let { automationId } = automationRes;
      let data = `<?xml version="1.0" encoding="UTF-8"?>
        <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
            <s:Header>
                <a:Action s:mustUnderstand="1">Delete</a:Action>
                <a:To s:mustUnderstand="1">${SFUrlBuilder.getSFMCSoapServiceUrl(
                  { subdomain: requestBody.subdomain }
                )}</a:To>
                <fueloauth xmlns="http://exacttarget.com">${
                  requestBody.access_token
                }</fueloauth>
            </s:Header>
            <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
            <DeleteRequest xmlns="http://exacttarget.com/wsdl/partnerAPI">
                <Options></Options>
                <Objects xsi:type="Automation">
                    <PartnerKey xsi:nil="true"></PartnerKey>
                    <ObjectID>${automationId}</ObjectID>
                </Objects>
            </DeleteRequest>
            </s:Body>
        </s:Envelope>
        `;

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${SFUrlBuilder.getSFMCSoapServiceUrl({
          subdomain: requestBody.subdomain,
        })}`,
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
        },
        data: data,
      };

      const res = await axios.request(config);
      const jsonData = xmljs.xml2json(res.data, {
        compact: true,
        spaces: 2,
      });
      const json = JSON.parse(jsonData);
      let result = json?.["soap:Envelope"]?.["soap:Body"]?.["DeleteResponse"];

      if (result?.["OverallStatus"]?.["_text"] === eDataExtensionStatus.OK) {
        await AppCredential.deleteMany({ mid: requestBody?.mid });
      }
      console.log("Automation Deleted for mid", requestBody?.mid);
      return json;
    } else throw "Record not found for Mid";
  } catch (err) {
    console.log("Error occured in delete data extension", err);
  }
};

export const deleteLicenseKeyData = async (requestBody: any) => {
  try {
    await connectDB();
    const licenseKeys = [requestBody.licenseKey];
    if (licenseKeys.length > 0) {
      for (const collection of deletedCollectionMap) {
        await deleteDocumentsByModel(collection.dbModel, licenseKeys);
        console.log(collection.dbModel, "deleted finished");
      }
      return true;
    }
  } catch (error) {
    console.log("Error occurred in deletion");
  }
};

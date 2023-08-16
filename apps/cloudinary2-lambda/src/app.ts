import cors from 'cors';
import express from 'express';
import serverless from 'serverless-http';

import { makeDynamoDocumentClient, makeSingleTableClient } from './clients';

import { config } from './config';
import { errorMiddleware } from './middlewares';

import { createServerlessMiddleware } from './middlewares';

export function bootstrap(): serverless.Application {
  const app = express();

  app.use(cors({ origin: '*' }));

  const dynamoDocumentClient = makeDynamoDocumentClient(config.dynamo);
  const singleTableClient = makeSingleTableClient(config.dynamo.tableName, dynamoDocumentClient);

  app.use(createServerlessMiddleware(config.serverless));
  app.use(
    express.json({
      type: ['application/json', 'application/vnd.contentful.management.v1+json'],
    })
  );

  // TODO: routes

  app.use(errorMiddleware);

  return app;
}

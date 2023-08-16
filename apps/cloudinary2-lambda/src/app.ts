import cors from 'cors';
import express from 'express';
import serverless from 'serverless-http';

import { makeDynamoDocumentClient, makeSingleTableClient } from './clients';
import { BackendParametersController, BackendParametersRepository } from './routes/backend-parameters';

import { config } from './config';
import { errorMiddleware } from './middlewares';

import { createServerlessMiddleware } from './middlewares';

export function bootstrap(): serverless.Application {
  const app = express();

  app.use(cors({ origin: '*' }));

  const dynamoDocumentClient = makeDynamoDocumentClient(config.dynamo);
  const singleTableClient = makeSingleTableClient(config.dynamo.tableName, dynamoDocumentClient);
  const backendParametersRepository = new BackendParametersRepository(singleTableClient);
  const backendParametersController = new BackendParametersController(backendParametersRepository);

  app.use(createServerlessMiddleware(config.serverless));
  app.use(
    express.json({
      type: ['application/json', 'application/vnd.contentful.management.v1+json'],
    })
  );

  app.post('/api/backend-parameters', backendParametersController.put);

  app.use(errorMiddleware);

  return app;
}

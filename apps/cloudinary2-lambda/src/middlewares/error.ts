import { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (error, request, response, next) => {
  if (error) {
    // Very dumb logging
    console.log(JSON.stringify(error));

    response.status(500).send({ status: 500, message: 'Internal Server Error' });
  }
  next();
};

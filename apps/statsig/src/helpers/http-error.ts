export class HttpError extends Error {
  constructor(readonly response: Response) {
    super(response.statusText);
  }
}

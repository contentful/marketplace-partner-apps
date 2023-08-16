export interface PutBackendParameters {
  apiSecret: string
}

export const putBackendParametersBodySchema = {
  type: 'object',
  properties: {
    apiSecret: { type: 'string' },
  },
  required: ['apiSecret'],
  additionalProperties: false,
};

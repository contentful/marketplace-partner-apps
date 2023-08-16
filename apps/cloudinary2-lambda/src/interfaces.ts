export enum Entity {
  BackendParameters = 'BackendParamters'
}

export interface BackendParameters {
  uuid: string;
  apiSecret: string;
}

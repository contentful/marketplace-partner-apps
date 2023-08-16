export enum Entity {
  BackendParameters = 'BackendParamters'
}

export interface BackendParameters {
  installationUuid: string;
  apiSecret: string;
}

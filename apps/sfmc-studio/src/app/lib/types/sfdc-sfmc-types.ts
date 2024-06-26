export type SFDCAuth = {
    baseUrl: string,
    credentials: { username: string, password: string, clientId: string, clientSecret: string } 
}

export type SFMCAuth = {
    subdomain: string,
    credentials: { clientId: string, clientSecret: string } 
}

export type SFMCDataQueryPayload = {
    customObjectKey: string
}
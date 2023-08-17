import { SingleTableClient } from '../../clients';
import { DynamoConfiguration } from '../../config';
import { BackendParameters, Entity } from '../../interfaces';
import { encrypt } from '../../services/dynamoDbUtils';

export class BackendParametersRepository {
  constructor(private dynamoConfig: DynamoConfiguration, private singleTableClient: SingleTableClient) {}

  async put(installationUuid: string, backendParametersInput: Omit<BackendParameters, 'installationUuid'>): Promise<BackendParameters> {
    const backendParameters = this.toDatabase(installationUuid, backendParametersInput);

    await this.singleTableClient.put(Entity.BackendParameters, installationUuid, [], backendParameters);

    return backendParameters;
  }

  private toDatabase(installationUuid: string, backendParameters: Omit<BackendParameters, 'installationUuid'>): BackendParameters {
    return {
      apiSecret: encrypt(backendParameters.apiSecret, this.dynamoConfig.encryptionSecret),
      installationUuid,
    };
  }
}

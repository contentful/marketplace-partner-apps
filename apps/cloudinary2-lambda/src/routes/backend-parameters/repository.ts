import { SingleTableClient } from '../../clients';
import { BackendParameters, Entity } from '../../interfaces';

const ONE_MINUTE = 60 * 1_000;

export class BackendParametersRepository {
  constructor(private singleTableClient: SingleTableClient) {}

  async put(installationUuid: string, backendParametersInput: Omit<BackendParameters, 'installationUuid'>): Promise<BackendParameters> {
    const backendParameters = BackendParametersRepository.toDatabase(installationUuid, backendParametersInput);

    await this.singleTableClient.put(Entity.BackendParameters, installationUuid, [], backendParameters);

    return backendParameters;
  }

  private static toDatabase(installationUuid: string, backendParameters: Omit<BackendParameters, 'installationUuid'>): BackendParameters {
    return {
      ...backendParameters,
      installationUuid,
    };
  }
}

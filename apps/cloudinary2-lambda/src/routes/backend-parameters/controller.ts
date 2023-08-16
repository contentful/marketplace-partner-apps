import { NotFoundException } from '../../errors';
import { assertValid, asyncHandler } from '../../utils';
import { BackendParametersRepository } from './repository';
import { PutBackendParameters, putBackendParametersBodySchema } from './validation';

export class BackendParametersController {
  constructor(private backendParametersRepository: BackendParametersRepository) {}

  put = asyncHandler(async (request, response) => {
    const installationUuid = request.header('x-contentful-uuid');

    if (!installationUuid) {
      throw new NotFoundException({
        errMessage: 'Installation UUID not found in headers',
      });
    }
    const backendParamters = assertValid<PutBackendParameters>(putBackendParametersBodySchema, request.body);

    await this.backendParametersRepository.put(installationUuid, backendParamters);

    response.status(204).send();
  });
}

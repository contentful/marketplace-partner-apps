import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
const verificationUrl = 'backend/contentful/test-authentication';
export const verifyKeys = async (appId, secretKey, customURL) => {
  try {
    await axios.get(`${customURL}/${verificationUrl}`, {
      headers: {
        'application-id': appId,
        'secret-key': secretKey,
      },
    });
    return true;
  } catch (error) {
    if (error.response && error.response.status === StatusCodes.UNAUTHORIZED) {
      throw new Error('The provided keys are invalid.');
    }
    throw new Error('Error while trying to verify the configuration.');
  }
};

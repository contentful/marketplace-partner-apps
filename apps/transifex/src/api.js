/**
 * Perform a GET request to the provided URL.
 *
 * @param {string} url - The URL to perform the GET request.
 * @returns {Promise<Object>} Returns a promise
 * @throws {Error} Throws an error if the request fails.
 */
export const get = async (url, headers) => {
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  const data = await response.json();
  return data;
};

/**
 * Make a post request
 * @param {string} url The request url
 * @param {obj} postData The post data
 * @param {obj} headers The headers
 * @returns {Promise<Object>} Returns a promise
 * @throws {Error} Throws an error if the request fails.
 */
export const post = async (url, data, headers) => {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: data,
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const responseData = await response.json();
  return responseData;
};

/**
 * Perform a delete request to the provided URL.
 *
 * @param {string} url - The URL to perform the delete request.
 * @returns {Promise<Object>} Returns a promise
 * @throws {Error} Throws an error if the request fails.
 */
export const deleteMethod = async (url, headers) => {
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error('Delete request failed');
  }

  return response.ok;
};

export const useBackOff = (attempts) => {
  if (attempts > 15) {
    return false;
  }

  return attempts * 500;
};

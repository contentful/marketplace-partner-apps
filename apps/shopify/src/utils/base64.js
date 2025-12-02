/**
 * Converts a base64 string to a regular string.
 * Works in both browser and Node.js environments.
 */
export const convertBase64ToString = (str) => {
  try {
    // Node.js environment
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'base64').toString('utf-8');
    }
    // Browser environment
    if (typeof window !== 'undefined' && window.atob) {
      return window.atob(str);
    }
    // Fallback: try global atob (available in some environments)
    if (typeof atob !== 'undefined') {
      return atob(str);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Converts a regular string to a base64 string.
 * Works in both browser and Node.js environments.
 */
export const convertStringToBase64 = (str) => {
  try {
    // Node.js environment
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf-8').toString('base64');
    }
    // Browser environment
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(str);
    }
    // Fallback: try global btoa (available in some environments)
    if (typeof btoa !== 'undefined') {
      return btoa(str);
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const convertProductToBase64 = (res) => {
  return {
    ...res,
    id: convertStringToBase64(res?.id),
    product: res?.product && { ...res?.product, id: convertStringToBase64(res?.product.id) },
  };
};

export const convertCollectionToBase64 = (res) => {
  return {
    ...res,
    id: convertStringToBase64(res.id),
  };
};

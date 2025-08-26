/**
 * Get value by key case insensitive from an object
 * @param key The key to search for in the object
 * @param obj The object to search in
 * @param defaultValue Default value to return if the key is not found or the object is null or undefined
 * @returns 
 */
export const getValueByKeyCaseInsensitive = function(key: string, obj: { [key: string]: string }, defaultValue: string) {
  if (!obj || !key) {
    return defaultValue;
  }

  key = key.toLowerCase()
  for(var p in obj){
    if(obj.hasOwnProperty(p) && key === p.toLowerCase()){
      return obj[p];
    }
  }

  return defaultValue;
}


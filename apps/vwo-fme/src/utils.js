import { get } from "lodash";

export const getEntryStatus = sys => {
   if (sys.archivedVersion) {
     return 'archived';
   } else if (sys.publishedVersion) {
     if (sys.version > sys.publishedVersion + 1) {
       return 'changed';
     } else {
       return 'published';
     }
   } else {
     return 'draft';
   }
 };

 export const validateCredentials = async (accountId, apiToken) => {
  if(!apiToken || !accountId){
    return false;
  }

  let url = `https://app.vwo.com/api/v2/accounts/${accountId}/smartcode`;
  const response = await fetch(url,{
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'token': apiToken
    }
  });

  if(response.ok){
    return {
      code: 200,
      message: 'User autherized with the VWO'
    };
  }
    else{
      const resp = await response.json();
      return resp._errors[0];
    }
  };

export const getRequiredEntryInformation = (entry, contentTypes, defaultLocale) => {
   const contentTypeId = get(entry, ['sys', 'contentType', 'sys', 'id']);
   const contentType = contentTypes.find(contentType => contentType.sys.id === contentTypeId);

   if(!contentType){
      throw new Error(`Content type ${contentTypeId} is not present`);
   }

   const displayField = contentType.displayField;
   const descriptionFieldType = contentType.fields
   .filter(field => field.id !== displayField)
   .find(field => field.type === 'Text');

   const description = descriptionFieldType
    ? get(entry, ['fields', descriptionFieldType.id, defaultLocale], '')
    : '';

    const title = get(entry, ['fields',displayField,defaultLocale],'Untitled');
    const status = getEntryStatus(entry.sys);

    return {
      title,
      description,
      contentType: contentType.name,
      status
    }
}

export const mapVwoVariationsAndContent = (vwoVariations,entries, contentTypes, defaultLocale) => {
  return vwoVariations.map(vwoVariation => {
    if(vwoVariation.variables.length && vwoVariation.variables[0].value){
      let contentId = vwoVariation.variables[0].value;
      let entry = entries.find(entry => entry.sys.id === contentId);
      if(!entry){
        return {vwoVariation};
      }
      let entryInformation = getRequiredEntryInformation(entry, contentTypes, defaultLocale);
      return {
        vwoVariation,
        variationContent: entryInformation
      }
    }
    return {vwoVariation};
  })
}
export default class VwoClient {
   constructor(params){
      if(!params.authToken || typeof params.authToken !== 'string'){
         throw new Error('You have to provide a valid token id');
      }

      this.accountId = params.accountId;
      this.accessToken = params.authToken;
      this.featureId = '';
      this.baseUrl = 'https://app.vwo.com/api/v2';
      this.onReauth = params.onReauth;
   }

   createFeatureFlag = async (featureFlag) => {
      let url = `https://app.vwo.com/api/v2/accounts/${this.accountId}/features`;
      const response = await fetch(url,{
         method: 'POST',
         body: JSON.stringify(featureFlag),
         headers: {
            'Content-Type': 'application/json',
            'token': this.accessToken
         }
      });
      
      if(response){
         const resp = await response.json();
         if(resp._data?.id){
            this.featureId = resp._data.id;
         }
         return resp;
      }

      this.onReauth();
      return Promise.reject(
         new Error(`request failed for url: ${url} with status: ${response.status}`)
      );
   }

   getFeatureFlagById = async (featureId) => {
      if(!this.featureId){
         this.featureId = featureId;
      }
      let url = `https://app.vwo.com/api/v2/accounts/${this.accountId}/features/${this.featureId}`;
      const response = await fetch(url,{
         method: 'GET',
         headers: {
            'Content-Type': 'application/json',
            'token': this.accessToken
         }
      });

      if(response){
         if(response.status === 429){
            return Promise.reject(
               new Error('Rate limit exceeded. Please try again later.')
            );
         }
         return await response.json();
      }

      this.onReauth();
      return Promise.reject(
         new Error(`request failed for url: ${url} with status: ${response.status}`)
      );
   }

   updateFeatureFlag = async (featureFlag) => {
      featureFlag.variations = featureFlag?.variations?.filter(variation => variation.id !== 1) ?? [];
      this.featureId = this.featureId || featureFlag.id;
      let url = `https://app.vwo.com/api/v2/accounts/${this.accountId}/features/${this.featureId}`;
      const response = await fetch(url,{
         method: 'PATCH',
         body: JSON.stringify(featureFlag),
         headers: {
            'Content-Type': 'application/json',
            'token': this.accessToken
         }
      });

      if(response){
         return await response.json();
      }

      this.onReauth();
      return Promise.reject(
         new Error(`request failed for url: ${url} with status: ${response.status}`)
      );
   }

   updateVariations = async (variations) => {
      let url = `https://app.vwo.com/api/v2/accounts/${this.accountId}/features/${this.featureId}`;
      const response = await fetch(url,{
         method: 'PATCH',
         body: JSON.stringify(variations),
         headers: {
            'Content-Type': 'application/json',
            'token': this.accessToken
         }
      });

      if(response){
         return await response.json();
      }

      this.onReauth();
      return Promise.reject(
         new Error(`request failed for url: ${url} with status: ${response.status}`)
      );
   }
}
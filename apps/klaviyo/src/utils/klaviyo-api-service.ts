/**
 * Interface representing field data structure
 */
export interface FieldData {
  id: string;
  name: string;
  type: string;
  value: any;
  isAsset: boolean;
  assetDetails?: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    fileName: string;
    contentType: string;
  }>;
}

/**
 * Interface representing Klaviyo API configuration
 */
export interface KlaviyoConfig {
  apiKey: string;
  privateKey?: string;
  listId?: string;
  endpoint?: string;
}

/**
 * Sends data to Klaviyo API
 * @param config Klaviyo API configuration
 * @param fieldMappings Field mappings for the data
 * @param entryData The entry data to be sent
 * @returns Response from the Klaviyo API
 */
export const sendToKlaviyo = async (
  config: KlaviyoConfig,
  fieldMappings: Record<string, string>,
  entryData: Record<string, FieldData>
): Promise<any> => {
  try {
    if (!config.apiKey) {
      throw new Error('Klaviyo API key is required');
    }

    // Transform field data according to mappings
    const transformedData = Object.entries(fieldMappings).reduce((acc, [contentfulField, klaviyoField]) => {
      if (entryData[contentfulField]) {
        acc[klaviyoField] = entryData[contentfulField].value;
      }
      return acc;
    }, {} as Record<string, any>);

    // Basic validation
    if (!transformedData.email && !transformedData.phone_number) {
      throw new Error('Either email or phone number is required for Klaviyo profiles');
    }

    // Endpoint defaults to profiles if not specified
    const endpoint = config.endpoint || 'profiles';
    const baseUrl = 'https://a.klaviyo.com/api/v2';

    // Build request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Klaviyo-API-Key ${config.apiKey}`
      },
      body: JSON.stringify({
        data: transformedData,
        ...(config.listId && { list_id: config.listId })
      })
    };

    // Make the API request
    const response = await fetch(`${baseUrl}/${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Klaviyo API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending data to Klaviyo:', error);
    throw error;
  }
};

/**
 * Class for syncing Contentful content to Klaviyo
 */
export class SyncContent {
  private proxyBaseUrl: string;

  constructor(proxyUrl = '/api/klaviyo') {
    this.proxyBaseUrl = proxyUrl;
  }

  /**
   * Syncs content from Contentful to Klaviyo
   * @param sdk The Contentful SDK
   * @param mappings Field mappings defining how to map Contentful fields to Klaviyo
   * @returns Promise with the results of the sync operation
   */
  async syncContent(sdk: any, mappings: Array<{contentfulFieldId: string, klaviyoBlockName: string, fieldType: string}>) {
    try {
      console.log('Starting content sync with mappings:', mappings);
      
      // Get installation parameters for API key
      const params = sdk.parameters?.installation || {};
      const apiKey = params.klaviyoApiKey;
      
      if (!apiKey) {
        throw new Error('Klaviyo API key is missing from installation parameters');
      }
      
      // Get entry data
      const entry = sdk.entry;
      const entryId = entry.getSys().id;
      console.log(`Processing entry: ${entryId}`);
      
      // Process field data
      const processedFields: Record<string, any> = {};
      
      for (const mapping of mappings) {
        const { contentfulFieldId, fieldType } = mapping;
        const field = entry.fields[contentfulFieldId];
        
        if (!field) {
          console.warn(`Field ${contentfulFieldId} not found in entry`);
          continue;
        }
        
        let value = field.getValue();
        
        // Handle asset fields
        if (fieldType === 'image' && value && value.sys) {
          try {
            // For image fields, get the asset details if possible
            const assetId = value.sys.id;
            const asset = await sdk.space.getAsset(assetId);
            
            if (asset && asset.fields.file) {
              const locale = sdk.locales?.default || 'en-US';
              const fileUrl = asset.fields.file[locale]?.url;
              
              if (fileUrl) {
                value = {
                  url: fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl,
                  title: asset.fields.title?.[locale] || '',
                  fileName: asset.fields.file[locale]?.fileName || ''
                };
              }
            }
          } catch (assetError) {
            console.error('Error getting asset details:', assetError);
          }
        }
        
        processedFields[contentfulFieldId] = {
          id: contentfulFieldId, 
          value,
          type: fieldType
        };
      }
      
      // Call the Klaviyo service through the proxy
      const response = await fetch(this.proxyBaseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          mappings,
          fields: processedFields,
          entryId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Klaviyo sync error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const result = await response.json();
      console.log('Sync completed successfully:', result);
      
      // Notify the user
      sdk.notifier.success('Content synced to Klaviyo successfully');
      
      return result;
    } catch (error: any) {
      console.error('Error syncing content to Klaviyo:', error);
      
      // Notify the user of the error
      if (sdk.notifier) {
        sdk.notifier.error(`Failed to sync content: ${error.message}`);
      }
      
      throw error;
    }
  }
}

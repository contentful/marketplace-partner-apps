import axios from 'axios';
import { KLAVIYO_API_BASE_URL, API_PROXY_URL, KlaviyoConfig, FieldMapping } from '../config/klaviyo';
import { log } from 'console';

export class KlaviyoService {
  private config: KlaviyoConfig;
  private api;
  private proxyApi;

  constructor(config: KlaviyoConfig) {
    this.config = config;
    
    // Direct API client (will be blocked by CORS in browser)
    this.api = axios.create({
      baseURL: KLAVIYO_API_BASE_URL,
      headers: {
        'Authorization': `Klaviyo-API-Key ${config.apiKey}`,
        'revision': '2023-02-22',
        'Content-Type': 'application/json',
      },
    });
    
    // Proxy API client (for browser usage)
    this.proxyApi = axios.create({
      baseURL: API_PROXY_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Helper method to use proxy for API calls
  private async callViaProxy(endpoint: string, method: string, data?: any) {
    try {
      const response = await this.proxyApi.post('', {
        endpoint,
        method,
        data
      });
      return response.data;
    } catch (error) {
      console.error(`Error calling Klaviyo API via proxy (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  async createUniversalContentBlock(name: string, content: string | object) {
    console.log('Creating universal content block:', name, content);
    try {
      // Check if content is already a string
      const contentToSend = typeof content === 'string' 
        ? content 
        : JSON.stringify(content);
        
      return await this.callViaProxy('/template-universal-content', 'POST', {
        data: {
          type: 'template-universal-content',
          attributes: {
            name,
            definition: {
              content_type: 'block',
              type: 'text',
              data: {
                content: contentToSend,
                display_options: {},
                styles: {},
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error creating universal content block:', error);
      throw error;
    }
  }

  async updateUniversalContentBlock(blockId: string, content: string) {
    try {
      return await this.callViaProxy(`/template-universal-content/${blockId}`, 'PATCH', {
        data: {
          type: 'universal-content-block',
          attributes: {
            definition: {
              data: content
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating universal content block:', error);
      throw error;
    }
  }

  public async uploadImage(
    imageUrl: string,
    name: string
  ): Promise<{ id: string; imageUrl: string }> {
    console.log(`Uploading image from ${imageUrl}`);

    let url = imageUrl;
    // If url doesn't start with http, assume it's a contentful asset and construct the full url
    if (!url.startsWith('http')) {
      url = `https:${url}`;
    }

    try {
      // Update to use the correct Klaviyo images API endpoint with the current revision
      const response = await this.callViaProxy('/images/', 'POST', {
        data: {
          type: 'image',
          attributes: {
            import_from_url: url,
            name: name
          }
        }
      });

      console.log(`Image upload successful: ${JSON.stringify(response)}`);
      
      // Extract the image ID and URL from the response
      const imageId = response.data.id;
      const uploadedImageUrl = response.data.attributes.url;
      
      return { id: imageId, imageUrl: uploadedImageUrl };
    } catch (error) {
      console.error(`Error uploading image: ${error}`);
      throw error;
    }
  }

  // Helper method to extract asset URL from Contentful asset reference
  private getAssetUrl(entry: any, fieldId: string): string | null {
    console.log(`Extracting asset URL for field ${fieldId}`);
    
    try {
      // First, check if we're dealing with the new SDK format
      if (entry.fields[fieldId]?._fieldLocales) {
        console.log(`Field ${fieldId} has _fieldLocales format`);
        const assetData = entry.fields[fieldId]._fieldLocales['en-US']._value;
        console.log(`Asset data from _fieldLocales:`, assetData);
        
        // If it's a string, it might be a JSON string that needs parsing
        if (typeof assetData === 'string' && assetData.includes('"sys"')) {
          try {
            console.log(`Asset data is a JSON string:`, assetData);
            const parsed = JSON.parse(assetData);
            
            // Check for Link type references to assets
            if (parsed.sys?.type === 'Link' && parsed.sys?.linkType === 'Asset') {
              // This is a link to an asset, but we need to resolve it
              console.log('Asset link found but needs to be resolved:', assetData);
              return null;
            }
          } catch (e) {
            // Not a valid JSON string, continue with other checks
            console.log(`Error parsing asset data:`, e);
          }
        }
        
        // If it's an object with fields property, it might be a resolved asset
        if (assetData?.fields?.file?.['en-US']?.url) {
          console.log(`Found file URL in _fieldLocales:`, assetData.fields.file['en-US'].url);
          return `https:${assetData.fields.file['en-US'].url}`;
        }
      }
      
      // Check for CMA-resolved asset
      if (entry.fields[fieldId]?.['en-US']?.fields?.file?.url) {
        console.log(`Found CMA-resolved asset with direct URL:`, entry.fields[fieldId]['en-US'].fields.file.url);
        return `https:${entry.fields[fieldId]['en-US'].fields.file.url}`;
      }
      
      // Check for old SDK format (direct access to fields)
      if (entry.fields[fieldId]?.['en-US']?.fields?.file?.['en-US']?.url) {
        console.log(`Found asset URL in old SDK format:`, entry.fields[fieldId]['en-US'].fields.file['en-US'].url);
        return `https:${entry.fields[fieldId]['en-US'].fields.file['en-US'].url}`;
      }
      
      // For assets that have already been published, check for the standard format
      if (entry.fields[fieldId]?.['en-US']?.url) {
        console.log(`Found direct asset URL:`, entry.fields[fieldId]['en-US'].url);
        return entry.fields[fieldId]['en-US'].url.startsWith('//') 
          ? `https:${entry.fields[fieldId]['en-US'].url}`
          : entry.fields[fieldId]['en-US'].url;
      }
      
      // Check for Link references to assets that have been resolved
      const fieldValue = entry.fields[fieldId]?.['en-US'];
      if (fieldValue && fieldValue.sys && fieldValue.sys.type === 'Link' && fieldValue.sys.linkType === 'Asset') {
        console.log(`Found Link reference to Asset but URL not available`);
        // We can't extract the URL directly, but we can log the asset ID for debugging
        if (fieldValue.sys.id) {
          console.log(`Asset ID from Link: ${fieldValue.sys.id}`);
        }
        return null;
      }
      
      console.log('Could not extract asset URL from', JSON.stringify(entry.fields[fieldId], null, 2));
      return null;
    } catch (error) {
      console.error('Error extracting asset URL:', error);
      return null;
    }
  }

  // Helper method to detect and format location data
  private formatLocationData(content: any): string | null {
    // Check if content is a stringified JSON object containing lat/lon coordinates
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object' && 
            (parsed.lat !== undefined || parsed.latitude !== undefined) && 
            (parsed.lon !== undefined || parsed.lng !== undefined || parsed.longitude !== undefined)) {
          
          // Extract coordinates with fallbacks for different property names
          const latitude = parsed.lat !== undefined ? parsed.lat : parsed.latitude;
          const longitude = parsed.lon !== undefined ? parsed.lon : 
                           (parsed.lng !== undefined ? parsed.lng : parsed.longitude);
          
          // Format as a readable location string
          return `Latitude: ${latitude}, Longitude: ${longitude}`;
        }
      } catch (e) {
        // Not valid JSON, return as is
        return content;
      }
    }
    
    // Check if content is a direct object with lat/lon coordinates
    if (content && typeof content === 'object' && 
        ((content.lat !== undefined || content.latitude !== undefined) && 
         (content.lon !== undefined || content.lng !== undefined || content.longitude !== undefined))) {
      
      // Extract coordinates with fallbacks for different property names
      const latitude = content.lat !== undefined ? content.lat : content.latitude;
      const longitude = content.lon !== undefined ? content.lon : 
                       (content.lng !== undefined ? content.lng : content.longitude);
      
      // Format as a readable location string
      return `Latitude: ${latitude}, Longitude: ${longitude}`;
    }
    
    // If it's not a location object, return null
    return null;
  }

  // Helper method to detect and format JSON objects
  private formatJsonObject(content: any): string | null {
    // Check if the content is a stringified JSON
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        
        // If it's an object or array, format it nicely
        if (typeof parsed === 'object' && parsed !== null) {
          // If it's a simple key-value object, format as a readable list
          if (!Array.isArray(parsed) && Object.keys(parsed).length > 0) {
            const keyValuePairs = Object.entries(parsed).map(([key, value]) => {
              // Format the value based on its type
              let formattedValue = value;
              if (typeof value === 'object' && value !== null) {
                formattedValue = JSON.stringify(value);
              }
              return `${key}: ${formattedValue}`;
            });
            
            return keyValuePairs.join('\n');
          }
        }
      } catch (e) {
        // Not valid JSON, return null to let other handlers process it
        return null;
      }
    }
    
    // If it's a direct object (not stringified)
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      const keyValuePairs = Object.entries(content).map(([key, value]) => {
        // Format the value based on its type
        let formattedValue = value;
        if (typeof value === 'object' && value !== null) {
          formattedValue = JSON.stringify(value);
        }
        return `${key}: ${formattedValue}`;
      });
      
      return keyValuePairs.join('\n');
    }
    
    // Not a JSON object we can format
    return null;
  }

  async syncContent(mappings: FieldMapping[], entry: any) {
    const results = [];
    
    console.log(`Starting content sync with ${mappings.length} mappings`);
    
    // First, log all the mappings we received
    for (const mapping of mappings) {
      console.log(`Mapping: field=${mapping.contentfulFieldId}, type=${mapping.fieldType}, block=${mapping.klaviyoBlockName}`);
    }
    
    for (const mapping of mappings) {
      try {
        console.log(`Processing mapping: ${JSON.stringify(mapping)}`);
        
        if (mapping.fieldType === 'text' || mapping.fieldType === 'entry' || mapping.fieldType === 'reference-array') {
          let content;
          
          // Handle different SDK versions for getting field values
          if (entry.fields[mapping.contentfulFieldId]?._fieldLocales) {
            // New SDK
            content = entry.fields[mapping.contentfulFieldId]._fieldLocales['en-US']._value || '';
          } else {
            // Old SDK
            content = entry.fields[mapping.contentfulFieldId]?.['en-US'] || '';
          }
          
          // Special handling for HTML content (converted from rich text)
          if (typeof content === 'string' && 
              (content.startsWith('<p>') || content.startsWith('<h') || 
               content.includes('</p>') || content.includes('</h'))) {
            console.log(`Found HTML content from rich text: ${content.substring(0, 100)}...`);
            // We'll create a content block in Klaviyo with the HTML
            const result = await this.createUniversalContentBlock(
              mapping.klaviyoBlockName,
              content
            );
            results.push(result);
            continue;
          }
          
          // Special handling for location data
          const formattedLocation = this.formatLocationData(content);
          if (formattedLocation !== null) {
            console.log(`Found and formatted location data: ${formattedLocation}`);
            
            // Use the formatted location string
            const result = await this.createUniversalContentBlock(
              mapping.klaviyoBlockName,
              formattedLocation
            );
            results.push(result);
            continue;
          }
          
          // Special handling for JSON objects
          const formattedJson = this.formatJsonObject(content);
          if (formattedJson !== null) {
            console.log(`Found and formatted JSON object: ${formattedJson.substring(0, 100)}${formattedJson.length > 100 ? '...' : ''}`);
            
            // Use the formatted JSON string
            const result = await this.createUniversalContentBlock(
              mapping.klaviyoBlockName,
              formattedJson
            );
            results.push(result);
            continue;
          }
          
          // Special handling for reference arrays
          // Check if this is a processed reference array (already converted to string by onEntryUpdate)
          if (typeof content === 'string' && 
             (content.includes('Referenced entry:') || 
              content.includes('[Unresolved reference:') || 
              content.includes(', '))) {
            console.log(`Found processed reference array content: ${content.substring(0, 100)}...`);
            // This is already processed by onEntryUpdate, so we can use it directly
          }
          // Check for JSON strings of entry references in case they weren't fully processed
          else if (typeof content === 'string' && 
              content.includes('"sys"') && 
              content.includes('"linkType":"Entry"')) {
            console.log(`Found Entry references in content: ${content.substring(0, 100)}...`);
            console.log(`This content was expected to be resolved by onEntryUpdate`);
            // We use the content as is, since resolving references should have happened in onEntryUpdate
          } else if (Array.isArray(content)) {
            // If it's an array, check if it's an array of references (which should have been processed)
            if (content.length > 0 && 
                content.some(item => item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry')) {
              console.log(`Found unprocessed array of references:`, content);
              // Since this should have been processed in onEntryUpdate, we'll just join the sys.id values
              const refIds = content
                .filter(item => item?.sys?.id)
                .map(item => `Reference ID: ${item.sys.id}`)
                .join(', ');
              content = refIds || JSON.stringify(content);
            } else {
              // For other arrays, stringify normally
              console.log(`Regular array content detected, stringifying:`, content);
              content = JSON.stringify(content);
            }
          } else if (typeof content === 'object' && content !== null) {
            // If it's any other object, stringify it
            console.log(`Object content detected, stringifying:`, content);
            content = JSON.stringify(content);
          }
          
          console.log(`Syncing ${mapping.fieldType} field:`, mapping.klaviyoBlockName, 
                      typeof content === 'string' && content.length > 100 
                        ? content.substring(0, 100) + '...' 
                        : content);
          
          const result = await this.createUniversalContentBlock(
            mapping.klaviyoBlockName,
            content
          );
          results.push(result);
        } else if (mapping.fieldType === 'image') {
          console.log('Processing image field:', mapping.contentfulFieldId);
          console.log('Field data:', JSON.stringify(entry.fields[mapping.contentfulFieldId], null, 2));
          
          // Try to extract image URL
          const imageUrl = this.getAssetUrl(entry, mapping.contentfulFieldId);
          
          if (imageUrl) {
            console.log('Uploading image URL to Klaviyo:', mapping.klaviyoBlockName, imageUrl);
            const result = await this.uploadImage(imageUrl, mapping.klaviyoBlockName);
            console.log('Image upload result:', result);
            results.push(result);
          } else {
            console.warn(`Could not extract image URL for field ${mapping.contentfulFieldId}`);
            
            // If we have a JSON string containing a sys.id reference, parse it and log
            try {
              const fieldData = entry.fields[mapping.contentfulFieldId];
              let assetReference;
              
              // Try to get the asset reference based on field structure
              if (fieldData?._fieldLocales?.['en-US']?._value) {
                assetReference = fieldData._fieldLocales['en-US']._value;
              } else if (fieldData?.['en-US']) {
                assetReference = fieldData['en-US'];
              }
              
              // If we have a string that looks like a JSON asset reference
              if (typeof assetReference === 'string' && assetReference.includes('"sys"')) {
                try {
                  const assetData = JSON.parse(assetReference);
                  if (assetData.sys?.type === 'Link' && assetData.sys?.linkType === 'Asset' && assetData.sys?.id) {
                    console.error(`Asset reference found but couldn't be resolved: ${assetData.sys.id}`);
                    console.error('This indicates that the asset resolution in onEntryUpdate failed.');
                    console.error('The asset needs to be resolved before reaching the KlaviyoService.');
                  }
                  // Check for entry references as well
                  else if (assetData.sys?.type === 'Link' && assetData.sys?.linkType === 'Entry' && assetData.sys?.id) {
                    console.error(`Entry reference found in image field: ${assetData.sys.id}`);
                    console.error('Entry references should be resolved to text content before reaching this point.');
                    console.error('Consider changing the field type to "entry" instead of "image".');
                  }
                } catch (e) {
                  // Not a valid JSON or not an asset reference
                  console.error('Error parsing potential asset/entry reference:', e);
                }
              } else {
                console.error('Unrecognized asset format:', assetReference);
              }
            } catch (e) {
              console.error('Error analyzing field data:', e);
            }
          }
        } else {
          console.warn(`Unknown field type "${mapping.fieldType}" for field ${mapping.contentfulFieldId}`);
        }
      } catch (error) {
        console.error(`Error syncing field ${mapping.contentfulFieldId}:`, error);
        // Continue with next mapping instead of stopping the entire process
      }
    }
    
    return results;
  }
} 
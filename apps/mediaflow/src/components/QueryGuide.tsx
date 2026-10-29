import { Heading, Paragraph, Table, MissingContent } from "@contentful/f36-components"

/**
 * A component that lists the metadata fields and how they are retrieved internally
 */
const QueryGuide = () => {

  return (
    <>
      <Heading as="h2">Query information</Heading>
      <Paragraph>All Mediaflow fields are JSON fields internally. Therefore querying Mediaflow fields will always deliver JSON data. Note, that modifying any of these with the CMA may break the Mediaflow fields.</Paragraph>

      <Heading as="h2">Type and content</Heading>
      <Paragraph>Depending on whether the field contains an image, video or file some fields may vary.</Paragraph>

      <Table >
        <Table.Head>
          <Table.Row>
            <Table.Cell>JSON Field</Table.Cell>
            <Table.Cell>Description</Table.Cell>
          </Table.Row>
        </Table.Head>

        <Table.Body>

          <Table.Row>
            <Table.Cell><code>basetype</code></Table.Cell>
            <Table.Cell>
              Indicates the type of content. Possible values:
              <ul>
                <li><code>image</code>: can be displayed with the <code>url</code></li>
                <li><code>video</code>: can be displayed with the <code>embedCode</code></li>
                <li>any other values: documents or other files. A download link can be accessed via <code>url</code></li>
              </ul>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell><code>url</code></Table.Cell>
            <Table.Cell>The url pointing to an image/file. Only applicable for images and non-video-files.</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell><code>embedMethod</code></Table.Cell>
            <Table.Cell>
              The method which is used to embed the video. Possible values:
              <ul>
                <li><code>javascript</code></li>
                <li><code>iframe</code></li>
              </ul>
              Only applicable for videos.
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell><code>embedCode</code></Table.Cell>
            <Table.Cell>The html-code which can be used to embed a videoplayer. Only applicable for videos.</Table.Cell>
          </Table.Row>

        </Table.Body>
      </Table>

      <Heading as="h2" marginTop="spacingM">Metadata</Heading>
      <Paragraph>Metadata can be accessed with the following properties:</Paragraph>

      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>Metadata</Table.Cell>
            <Table.Cell>JSON Field</Table.Cell>
            <Table.Cell>Notes</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>

          <Table.Row>
            <Table.Cell>ID</Table.Cell>
            <Table.Cell><code>id</code></Table.Cell>
            <Table.Cell>The ID the asset has in Mediaflow.</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Name</Table.Cell>
            <Table.Cell><code>name</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Description</Table.Cell>
            <Table.Cell><code>description</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Filename</Table.Cell>
            <Table.Cell><code>filename</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Filetype</Table.Cell>
            <Table.Cell><code>filetype</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Width</Table.Cell>
            <Table.Cell><code>width</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Height</Table.Cell>
            <Table.Cell><code>height</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Alt text</Table.Cell>
            <Table.Cell><code>altText</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Photographer</Table.Cell>
            <Table.Cell><code>photographer</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Instructions</Table.Cell>
            <Table.Cell><code>instructions</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Keywords</Table.Cell>
            <Table.Cell><code>keywords</code></Table.Cell>
            <Table.Cell>The return type will be an array containing strings</Table.Cell>
          </Table.Row>

          {/* TODO customer specific custom fields */}
          <Table.Row>
            <Table.Cell>Custom Fields</Table.Cell>
            <Table.Cell><code>customFields</code></Table.Cell>
            <Table.Cell>See <a href="#customFields">below</a> for more info</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Additional Info</Table.Cell>
            <Table.Cell>additionalInfo</Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Canvas Width</Table.Cell>
            <Table.Cell>canvasWidth</Table.Cell>
            <Table.Cell>Only applicable for images</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Canvas Height</Table.Cell>
            <Table.Cell>canvasHeight</Table.Cell>
            <Table.Cell>Only applicable for images</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Crop Coordinates</Table.Cell>
            <Table.Cell>cropCoordinates</Table.Cell>
            <Table.Cell>Only applicable for images</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Crop Width</Table.Cell>
            <Table.Cell>cropWidth</Table.Cell>
            <Table.Cell>Only applicable for images</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell>Crop Height</Table.Cell>
            <Table.Cell>cropHeight</Table.Cell>
            <Table.Cell>Only applicable for images</Table.Cell>
          </Table.Row>

        </Table.Body>
      </Table>

      <Heading as="h2" id="customFields" marginTop="spacingM">Custom fields</Heading>
      <Paragraph>Custom fields are an array of objects, with each object containing the following fields</Paragraph>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>JSON Field</Table.Cell>
            <Table.Cell>Description</Table.Cell>
          </Table.Row>
        </Table.Head>

        <Table.Body>

          <Table.Row>
            <Table.Cell><code>id</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell><code>name</code></Table.Cell>
            <Table.Cell><MissingContent /></Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell><code>type</code></Table.Cell>
            <Table.Cell>
              The type of the field as string. Possible values are:
              <ul>
                <li><code>STRING</code> (corresponds to short text fields)</li>
                <li><code>TEXT</code> (corresponds to long text fields)</li>
                <li><code>NUMBER</code></li>
                <li><code>DATE</code></li>
                <li><code>SELECT</code> (corresponds to drop down menu)</li>
                <li><code>MULTISELECT</code> (corresponds to checkboxes)</li>
              </ul>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell><code>value</code></Table.Cell>
            <Table.Cell>This will always be a string. In case of a <code>MULTISELECT</code> this will be a comma-separated string.</Table.Cell>
          </Table.Row>

        </Table.Body>
      </Table>

      <Heading as="h2" id="internalFields" marginTop="spacingM">Internal Fields</Heading>
      <Paragraph>Internal fields are not visible to the editor and are used to store information required by the app. They can still be queried by the Contentful Delivery API to deliver useful information, but should not be changed via the Contentful Management API as this could break the fields.</Paragraph>
      <Table>
        <Table.Head>
          <Table.Row>
            <Table.Cell>JSON Field</Table.Cell>
            <Table.Cell>Description</Table.Cell>
          </Table.Row>
        </Table.Head>

        <Table.Body>
          <Table.Row>
            <Table.Cell><code>isMediaflowAsset</code></Table.Cell>
            <Table.Cell>Will be <code>true</code> if the entry field is a Mediaflow field. Can be used to distinguish between regular JSON-Fields.</Table.Cell>
          </Table.Row>

          <Table.Row>
            <Table.Cell><code>isCropped</code></Table.Cell>
            <Table.Cell>Only applies to assets with the basetype <code>image</code>.</Table.Cell>
          </Table.Row>

        </Table.Body>
      </Table>
    </>
  );
}

export default QueryGuide;

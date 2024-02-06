import { ContentTypeField } from "@contentful/app-sdk";

export type ContentTypeConfiguration = {
  id: string;
  name: string;
  description: string;
  fields: ({ helpText: string } & ContentTypeField)[];
  displayField: string;
};

const DEFAULTS = {
  variant: "Variant",
  product: "Product",
  taxonomy: "Taxonomy",
  taxon: "Taxon",
};

const getSchema = ({
  localized = false,
  productLabel,
  variantLabel,
  taxonomyLabel,
  taxonLabel,
}: {
  localized?: boolean;
  productLabel?: string;
  variantLabel?: string;
  taxonomyLabel?: string;
  taxonLabel?: string;
}): ContentTypeConfiguration[] => {
  return [
    {
      id: "variant",
      name: variantLabel || DEFAULTS.variant,
      displayField: "name",
      description:
        "Represents a specific variant of a product. Variants are typically different versions of a product, differentiated by attributes like size, color, or other specifications. Each variant has a unique SKU for inventory tracking and may have its own set of images.",
      fields: [
        {
          id: "name",
          name: "Name",
          type: "Symbol",
          required: true,
          helpText: "The unique name or title of this particular variant.",
          localized,
        },
        {
          id: "description",
          name: "Description",
          type: "Text",
          required: false,
          helpText:
            " A description that details the specifics of this variant, such as its unique features or differences from other variants.",
          localized,
        },
        {
          id: "sku",
          name: "SKU",
          type: "Symbol",
          required: true,
          helpText:
            " Stock Keeping Unit, a unique identifier for each variant used for inventory management.",
          localized,
        },
        {
          id: "images",
          name: "Images",
          type: "Array",
          items: {
            type: "Link",
            linkType: "Asset",
          },
          required: false,
          helpText:
            "Visual representations of the variant, providing a clear and accurate portrayal of the product's appearance.",
          localized,
        },
      ],
    },
    {
      id: "product",
      name: productLabel || DEFAULTS.product,
      displayField: "name",
      description:
        "Represents a general product offering that can have multiple variants. This content type includes basic product information such as the product name and description. It also references the various variants of the product, allowing for a comprehensive view of all available options.",
      fields: [
        {
          id: "name",
          name: "Name",
          type: "Symbol",
          required: true,
          helpText: "The product name as it should appear in listings.",
          localized,
        },
        {
          id: "description",
          name: "Description",
          type: "Text",
          required: false,
          helpText:
            "Detailed information about the product, including its features and benefits.",
          localized,
        },
        {
          id: "variants",
          name: "Variants",
          type: "Array",
          items: {
            type: "Link",
            linkType: "Entry",
            validations: [
              {
                linkContentType: ["variant"],
              },
            ],
          },
          required: false,
          helpText:
            "Different variations of the product, such as sizes or colors, each with its own SKU.",
          localized,
        },
      ],
    },
    {
      id: "taxon",
      name: taxonLabel || DEFAULTS.taxon,
      displayField: "name",
      description:
        "Represents individual categories or subcategories within a taxonomy. Taxons help in organizing products into hierarchical structures, making it easier to navigate and find products. A taxon can reference other taxons, allowing for nested categorization, and can also link to specific products that fall under it.",
      fields: [
        {
          id: "name",
          name: "Name",
          type: "Symbol",
          required: true,
          helpText:
            "The name of the category or subcategory as it should be displayed.",
          localized,
        },
        {
          id: "description",
          name: "Description",
          type: "Text",
          required: false,
          helpText:
            "An explanation of the category, possibly including what types of products it encompasses.",
          localized,
        },
        {
          id: "taxons",
          name: "Taxons",
          type: "Array",
          items: {
            type: "Link",
            linkType: "Entry",
            validations: [
              {
                linkContentType: ["taxon"],
              },
            ],
          },
          required: false,
          helpText:
            "Subcategories or nested categories within this taxon, allowing for a multi-level taxonomy structure.",
          localized,
        },
        {
          id: "products",
          name: "Products",
          type: "Array",
          items: {
            type: "Link",
            linkType: "Entry",
            validations: [
              {
                linkContentType: ["product"],
              },
            ],
          },
          required: false,
          helpText: "Products that fall under this specific category.",
          localized,
        },
      ],
    },
    {
      id: "taxonomy",
      name: taxonomyLabel || DEFAULTS.taxonomy,
      displayField: "name",
      description:
        "Represents the overall categorization system used to organize products. A taxonomy is a hierarchical structure comprising various taxons. This content type defines the broad categories and their relationships, serving as a framework for the classification of products.",
      fields: [
        {
          id: "name",
          name: "Name",
          type: "Symbol",
          required: true,
          helpText:
            "The name of the taxonomy, usually representing a broad category.",
          localized,
        },
        {
          id: "description",
          name: "Description",
          type: "Text",
          required: false,
          helpText:
            "A general overview of the taxonomy's purpose and what types of products it includes.",
          localized,
        },
        {
          id: "taxons",
          name: "Taxons",
          type: "Array",
          items: {
            type: "Link",
            linkType: "Entry",
            validations: [
              {
                linkContentType: ["taxon"],
              },
            ],
          },
          required: false,
          helpText:
            "The individual categories or 'taxons' that make up the levels of this taxonomy.",
          localized,
        },
      ],
    },
    {
      id: "catalog",
      name: "Catalog",
      displayField: "name",
      description:
        "Represents a collection of products, typically grouped under specific taxonomies for organizational purposes. A catalog is used to present a curated selection of products, often tailored for specific markets, seasons, or themes. It references taxonomies to leverage the established hierarchical structure for product categorization.",
      fields: [
        {
          id: "name",
          name: "Name",
          type: "Symbol",
          required: true,
          helpText:
            "The title of the catalog, which may denote its purpose or the collection it represents.",
          localized,
        },
        {
          id: "description",
          name: "Description",
          type: "Text",
          required: false,
          helpText:
            "Detailed information about the catalog, including its target audience or the range of products it includes.",
          localized,
        },
        {
          id: "taxonomies",
          name: "Taxonomies",
          type: "Array",
          items: {
            type: "Link",
            linkType: "Entry",
            validations: [
              {
                linkContentType: ["taxonomy"],
              },
            ],
          },
          required: false,
          helpText:
            "The taxonomies included in this catalog, which structure the organization of the products within.",
          localized,
        },
      ],
    },
  ];
};

export default getSchema;

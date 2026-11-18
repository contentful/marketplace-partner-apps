import { SalesforceField } from "./locations/Field";

export const SALESFORCE_FIELDS: SalesforceField[] = [
  { id: "first_name", label: "First Name", type: "text", required: true },
  { id: "last_name", label: "Last Name", type: "text", required: true },
  { id: "email", label: "Email", type: "email", required: true },
  { id: "company", label: "Company", type: "text", required: true },
  {
    id: "salutation",
    label: "Salutation",
    type: "select",
    options: ["Mr.", "Ms.", "Mrs.", "Dr."],
  },
  { id: "title", label: "Title", type: "text" },
  { id: "url", label: "Website", type: "url" },
  { id: "phone", label: "Phone", type: "tel" },
  { id: "mobile", label: "Mobile", type: "tel" },
  { id: "fax", label: "Fax", type: "tel" },
  { id: "street", label: "Street", type: "text" },
  { id: "city", label: "City", type: "text" },
  { id: "state", label: "State/Province", type: "text" },
  { id: "zip", label: "Zip", type: "text" },
  { id: "country", label: "Country", type: "text" },
  { id: "description", label: "Description", type: "textarea" },
  {
    id: "lead_source",
    label: "Lead Source",
    type: "select",
    options: ["Web", "Phone Inquiry", "Partner Referral", "Other"],
  },
  {
    id: "industry",
    label: "Industry",
    type: "select",
    options: [
      "Technology",
      "Healthcare",
      "Finance",
      "Education",
      "Retail",
      "Manufacturing",
      "Other",
    ],
  },
  {
    id: "rating",
    label: "Rating",
    type: "select",
    options: ["Hot", "Warm", "Cold"],
  },
  { id: "revenue", label: "Annual Revenue", type: "text" },
  { id: "employees", label: "Employees", type: "number" },
  { id: "Campaign_ID", label: "Campaign", type: "hidden" },
  { id: "member_status", label: "Campaign Member Status", type: "hidden" },
  { id: "emailOptOut", label: "Email Opt Out", type: "checkbox" },
  { id: "faxOptOut", label: "Fax Opt Out", type: "checkbox" },
  { id: "doNotCall", label: "Do Not Call", type: "checkbox" },
];

// These need to be dynamic
export const CAMPAIGN_OPTIONS = [
  { value: "701Wz00000GeCES", label: "Customer Conference Event (Sample)" },
  {
    value: "701Wz00000GeCET",
    label: "Customer Conference - Email Invite (Sample)",
  },
  { value: "701Wz00000GeCEU", label: "Widgets Webinar (Sample)" },
];

export const DEFAULT_SELECTED_FIELDS = SALESFORCE_FIELDS.filter((field) =>
  ["first_name", "last_name", "email", "company", "city", "state"].includes(
    field.id
  )
);

export interface VertexAIRegionOption {
  value: string
  label: string
}

export const VERTEX_AI_REGION_OPTIONS: Record<string, VertexAIRegionOption[]> = {
  'North America': [
    { value: 'us-east5', label: 'Columbus, Ohio (us-east5)' },
    { value: 'us-south1', label: 'Dallas, Texas (us-south1)' },
    { value: 'us-central1', label: 'Iowa (us-central1)' },
    { value: 'us-west4', label: 'Las Vegas, Nevada (us-west4)' },
    { value: 'us-west2', label: 'Los Angeles, California (us-west2)' },
    { value: 'us-east1', label: 'Moncks Corner, South Carolina (us-east1)' },
    { value: 'us-east4', label: 'Northern Virginia (us-east4)' },
    { value: 'us-west1', label: 'Oregon (us-west1)' },
    { value: 'us-west3', label: 'Salt Lake City, Utah (us-west3)' },
  ],
  Canada: [
    { value: 'northamerica-northeast1', label: 'Montréal (northamerica-northeast1)' },
    { value: 'northamerica-northeast2', label: 'Toronto (northamerica-northeast2)' },
  ],
  'South America': [
    { value: 'southamerica-west1', label: 'Santiago, Chile (southamerica-west1)' },
    { value: 'southamerica-east1', label: 'São Paulo, Brazil (southamerica-east1)' },
  ],
  Africa: [{ value: 'africa-south1', label: 'Johannesburg, South Africa (africa-south1)' }],
  Europe: [
    { value: 'europe-west1', label: 'Belgium (europe-west1)' },
    { value: 'europe-north1', label: 'Finland (europe-north1)' },
    { value: 'europe-west3', label: 'Frankfurt, Germany (europe-west3)' },
    { value: 'europe-west2', label: 'London, United Kingdom (europe-west2)' },
    { value: 'europe-southwest1', label: 'Madrid, Spain (europe-southwest1)' },
    { value: 'europe-west8', label: 'Milan, Italy (europe-west8)' },
    { value: 'europe-west4', label: 'Netherlands (europe-west4)' },
    { value: 'europe-west9', label: 'Paris, France (europe-west9)' },
    { value: 'europe-west12', label: 'Turin, Italy (europe-west12)' },
    { value: 'europe-central2', label: 'Warsaw, Poland (europe-central2)' },
    { value: 'europe-west6', label: 'Zürich, Switzerland (europe-west6)' },
  ],
  'Asia Pacific': [
    { value: 'asia-east2', label: 'Hong Kong, China (asia-east2)' },
    { value: 'asia-southeast2', label: 'Jakarta, Indonesia (asia-southeast2)' },
    { value: 'australia-southeast2', label: 'Melbourne, Australia (australia-southeast2)' },
    { value: 'asia-south1', label: 'Mumbai, India (asia-south1)' },
    { value: 'asia-northeast2', label: 'Osaka, Japan (asia-northeast2)' },
    { value: 'asia-northeast3', label: 'Seoul, Korea (asia-northeast3)' },
    { value: 'asia-southeast1', label: 'Singapore (asia-southeast1)' },
    { value: 'australia-southeast1', label: 'Sydney, Australia (australia-southeast1)' },
    { value: 'asia-east1', label: 'Taiwan (asia-east1)' },
    { value: 'asia-northeast1', label: 'Tokyo, Japan (asia-northeast1)' },
  ],
  'Middle East': [
    { value: 'me-central2', label: 'Dammam, Saudi Arabia (me-central2)' },
    { value: 'me-central1', label: 'Doha, Qatar (me-central1)' },
    { value: 'me-west1', label: 'Tel Aviv (me-west1)' },
  ],
}

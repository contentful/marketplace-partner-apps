export interface AITagItem {
  name: string
  confidence: number
  source: 'google-auto-tagging' | 'aws-auto-tagging'
} 
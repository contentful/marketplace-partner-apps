import i18n from 'i18next';

// English translations
const enTranslations = {
  american_english: 'American English ',
  british_oxford: 'British Oxford',
  canadian_english: 'Canadian English',
  academic: 'Academic',
  business: 'Business',
  conversational: 'Conversational',
  formal: 'Formal',
  informal: 'Informal',
  technical: 'Technical',
  ap: 'AP',
  chicago: 'Chicago',
  microsoft: 'Microsoft',
  demo: 'Demo',
  clarity: 'Clarity',
  grammar: 'Grammar',
  style_guide: 'Style Guide',
  tone: 'Tone',
  terminology: 'Terminology',
  average_sentence_length: 'Average Sentence Length',
  flesch_kincaid_grade: 'Flesch-Kincaid Grade',
  flesch_reading_ease: 'Flesch Reading Ease',
  lexical_diversity: 'Lexical Diversity',
  score: 'Score',
  sentence_complexity: 'Sentence Complexity',
  sentence_count: 'Sentence Count',
  vocabulary_complexity: 'Vocabulary Complexity',
  word_count: 'Word Count',
  informality: 'Informality',
  liveliness: 'Liveliness',
  analysis_configuration: 'Analysis Configuration',
  style_guide_type: 'Style Guide',
  dialect: 'Dialect',
};

// Initialize i18next
i18n.init({
  lng: 'en', // default language
  fallbackLng: 'en',
  debug: false,
  resources: {
    en: {
      translation: enTranslations,
    },
  },
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;

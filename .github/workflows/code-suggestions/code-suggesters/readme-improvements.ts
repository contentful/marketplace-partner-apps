import fs from 'fs';
import path from 'path';
import type { ValidatorOptions, CodeSuggestion } from '../../types';

function fileExists(appDir: string, fileName: string): boolean {
  const filePath = path.join(process.cwd(), appDir, fileName);
  return fs.existsSync(filePath);
}

function readFile(appDir: string, fileName: string): string | null {
  const filePath = path.join(process.cwd(), appDir, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Failed to read file ${fileName} for ${appDir}:`, error);
    return null;
  }
}

const RECOMMENDED_README_SECTIONS = [
  '# App Name',
  '## Overview',
  '## Features',
  '## Installation',
  '## Usage',
  '## Development',
  '## Contributing',
  '## License',
];

const README_TEMPLATE = (appName: string) => `# ${appName}

## Overview

Brief description of what this Contentful app does and its purpose.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

This app is available in the [Contentful Marketplace](https://www.contentful.com/marketplace/).

To install:
1. Navigate to your Contentful space
2. Go to Apps in the navigation
3. Browse the marketplace and find this app
4. Click "Install" and follow the setup instructions

## Usage

Describe how to use the app after installation:

1. Step 1
2. Step 2
3. Step 3

## Development

To run this app locally for development:

\`\`\`bash
npm install
npm start
\`\`\`

### Testing

\`\`\`bash
npm test
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

### Building

\`\`\`bash
npm run build
\`\`\`

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the terms specified in the LICENSE file.
`;

export const suggest = async (_options: ValidatorOptions, appDir: string): Promise<CodeSuggestion | null> => {
  const appName = appDir.split('/').pop() || 'App';
  const readmeExists = fileExists(appDir, 'README.md');

  if (!readmeExists) {
    // Suggest creating a comprehensive README
    return {
      category: 'Documentation',
      description: 'Created comprehensive README.md with all recommended sections',
      hasChanges: true,
      fileChanges: [
        {
          path: `${appDir}/README.md`,
          description: 'Added complete README.md with documentation structure',
          newContent: README_TEMPLATE(appName),
          operation: 'create',
        },
      ],
    };
  }

  // If README exists, check if it needs improvements
  const readmeContent = readFile(appDir, 'README.md');
  if (!readmeContent) {
    return null;
  }

  const suggestions: string[] = [];
  let updatedContent = readmeContent;
  let hasChanges = false;

  // Check for missing sections
  const missingSections: string[] = [];

  for (const section of RECOMMENDED_README_SECTIONS) {
    const sectionHeader = section.toLowerCase().replace('#', '').trim();
    const hasSection = readmeContent.toLowerCase().includes(sectionHeader);

    if (!hasSection) {
      missingSections.push(section);
    }
  }

  // If README is very short or missing key sections, suggest improvements
  if (readmeContent.length < 200 || missingSections.length >= 3) {
    const improvedReadme = `${readmeContent}

<!-- The following sections were automatically suggested to improve documentation -->

${missingSections
  .map((section) => {
    switch (section) {
      case '## Features':
        return `${section}

- Feature 1: Describe key functionality
- Feature 2: Describe another feature
- Feature 3: Describe additional capabilities`;

      case '## Installation':
        return `${section}

This app is available in the [Contentful Marketplace](https://www.contentful.com/marketplace/).

To install:
1. Navigate to your Contentful space
2. Go to Apps in the navigation
3. Browse the marketplace and find this app
4. Click "Install" and follow the setup instructions`;

      case '## Development':
        return `${section}

To run this app locally for development:

\`\`\`bash
npm install
npm start
\`\`\`

### Testing

\`\`\`bash
npm test
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

### Building

\`\`\`bash
npm run build
\`\`\``;

      case '## Contributing':
        return `${section}

Please read our contributing guidelines before submitting pull requests.`;

      case '## License':
        return `${section}

This project is licensed under the terms specified in the LICENSE file.`;

      default:
        return `${section}

TODO: Add content for this section.`;
    }
  })
  .join('\n\n')}
`;

    updatedContent = improvedReadme;
    suggestions.push(`Added ${missingSections.length} missing documentation sections`);
    hasChanges = true;
  }

  if (!hasChanges) {
    return null;
  }

  return {
    category: 'Documentation',
    description: `Improved README.md documentation`,
    hasChanges: true,
    fileChanges: [
      {
        path: `${appDir}/README.md`,
        description: suggestions.join(', '),
        newContent: updatedContent,
        operation: 'update',
      },
    ],
  };
};

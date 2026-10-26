# Automated Code Suggestions

This directory contains the automated code suggestion system for marketplace partner apps.

## Overview

The code suggestion system automatically analyzes apps in the repository and creates pull requests with suggested improvements based on best practices and coding standards.

## How It Works

1. **Scheduled Analysis**: The system runs weekly on Mondays at 9 AM UTC
2. **Manual Trigger**: Can be manually triggered via GitHub Actions with optional app targeting
3. **Suggestion Generation**: Each app is analyzed by multiple code suggesters
4. **PR Creation**: If improvements are found, a pull request is automatically created with the suggestions

## Code Suggesters

The system includes several specialized suggesters:

### Package.json Improvements (`package-json-improvements.ts`)
- Adds missing `install-ci` script
- Replaces placeholder test scripts with `vitest`
- Adds relevant keywords for better discoverability
- Adds or improves package description
- Adds repository information
- Adds homepage URL

### ESLint Configuration (`eslint-improvements.ts`)
- Creates comprehensive ESLint configuration files
- Adds missing ESLint dependencies
- Creates `.eslintignore` file with common patterns
- Follows TypeScript and React best practices

### README Documentation (`readme-improvements.ts`)
- Creates comprehensive README.md for apps without one
- Adds missing sections (Features, Installation, Usage, Development, etc.)
- Improves documentation structure and content

### TypeScript Configuration (`typescript-config.ts`)
- Creates appropriate `tsconfig.json` files
- Optimizes configuration for Vite projects
- Adds recommended compiler options
- Creates `tsconfig.node.json` for Vite environments

## Usage

### Automatic (Scheduled)
The workflow runs automatically every Monday. No action required.

### Manual Trigger
1. Go to Actions → "Automated Code Suggestions"
2. Click "Run workflow"
3. Optionally specify a target app name
4. Click "Run workflow"

### Reviewing Suggestions
1. PRs created by the system will have the label `automated-suggestions`
2. Review each suggested change carefully
3. Approve and merge changes that improve your app
4. Close PRs with suggestions you don't want to apply

## Adding New Suggesters

To add a new code suggester:

1. Create a new file in `code-suggesters/` following the pattern:
   ```typescript
   export const suggest = async (
     _options: ValidatorOptions,
     appDir: string
   ): Promise<CodeSuggestion | null> => {
     // Your analysis logic here
     // Return null if no suggestions, or a CodeSuggestion object
   };
   ```

2. Implement your analysis logic
3. Return suggestions with file changes
4. The system will automatically load and use your suggester

## Types

Key types used by the system:

- `CodeSuggester`: Interface for suggestion functions
- `CodeSuggestion`: Contains category, description, and file changes
- `FileChange`: Represents a single file modification
- `ValidatorOptions`: GitHub API context and utilities

## Best Practices

- Keep suggestions focused and non-breaking
- Provide clear descriptions for all changes
- Test thoroughly before adding new suggesters
- Follow the existing code patterns and naming conventions
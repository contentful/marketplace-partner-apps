import fs from 'fs';
import path from 'path';
import type { CodeSuggestion, ValidatorOptions, CodeSuggester } from '../types';

async function getSuggesters(directory: string): Promise<Record<PropertyKey, CodeSuggester>> {
  const suggesters: Record<PropertyKey, CodeSuggester> = {};

  if (!fs.existsSync(directory)) {
    console.log(`Code suggesters directory not found: ${directory}`);
    return suggesters;
  }

  const files = fs.readdirSync(directory);

  // suggesters will be compiled by the time this runs
  const suggesterExtension = '.js';

  for (const file of files) {
    if (file.endsWith(suggesterExtension)) {
      const suggesterName = path.basename(file, suggesterExtension);
      try {
        suggesters[suggesterName] = await import(path.join(directory, file));
      } catch (error) {
        console.error(`Failed to load suggester ${suggesterName}:`, error);
      }
    }
  }

  return suggesters;
}

interface CodeSuggestionOptions extends ValidatorOptions {
  targetApp?: string;
}

async function getAllApps(): Promise<string[]> {
  const appsDir = path.join(process.cwd(), 'apps');
  const apps = fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `apps/${entry.name}`);
  return apps;
}

async function analyzeSuggestAndCreate({ github, ctx, ghCore, targetApp }: CodeSuggestionOptions): Promise<void> {
  console.log('Starting automated code suggestions analysis...');

  // Get list of apps to analyze
  const allApps = await getAllApps();
  const appsToAnalyze = targetApp ? allApps.filter((app) => app === `apps/${targetApp}` || app.endsWith(`/${targetApp}`)) : allApps;

  if (appsToAnalyze.length === 0) {
    console.log(`No apps found to analyze${targetApp ? ` (looking for: ${targetApp})` : ''}`);
    return;
  }

  console.log(`Analyzing ${appsToAnalyze.length} apps:`, appsToAnalyze);

  // Load code suggesters
  const suggesters = await getSuggesters(path.join(__dirname, 'code-suggesters'));

  // Analyze each app and collect suggestions
  const allSuggestions: Record<string, CodeSuggestion[]> = {};

  for (const appDir of appsToAnalyze) {
    console.log(`Analyzing app: ${appDir}`);
    const suggestions: CodeSuggestion[] = [];

    for (const [suggesterName, suggester] of Object.entries(suggesters)) {
      if (suggester && typeof suggester.suggest === 'function') {
        try {
          const suggestion = await suggester.suggest({ github, ctx, ghCore }, appDir);
          if (suggestion && suggestion.hasChanges) {
            suggestions.push(suggestion);
            console.log(`${suggesterName} found suggestions for ${appDir}`);
          }
        } catch (error) {
          console.error(`Error running suggester ${suggesterName} on ${appDir}:`, error);
        }
      }
    }

    if (suggestions.length > 0) {
      allSuggestions[appDir] = suggestions;
    }
  }

  // Create PRs for apps with suggestions
  for (const [appDir, suggestions] of Object.entries(allSuggestions)) {
    await createSuggestionPR(github, ctx, appDir, suggestions);
  }

  if (Object.keys(allSuggestions).length === 0) {
    console.log('No code suggestions found for any apps.');
  } else {
    console.log(`Created suggestion PRs for ${Object.keys(allSuggestions).length} apps.`);
  }
}

async function createSuggestionPR(
  github: ValidatorOptions['github'],
  ctx: ValidatorOptions['ctx'],
  appDir: string,
  suggestions: CodeSuggestion[]
): Promise<void> {
  const appName = path.basename(appDir);
  const branchName = `automated-suggestions/${appName}-${Date.now()}`;

  // Get the default branch SHA
  const { data: defaultBranch } = await github.rest.repos.getBranch({
    ...ctx.repo,
    branch: 'main',
  });

  // Create a new branch
  await github.rest.git.createRef({
    ...ctx.repo,
    ref: `refs/heads/${branchName}`,
    sha: defaultBranch.commit.sha,
  });

  // Apply all changes to the branch
  const changesSummary: string[] = [];

  for (const suggestion of suggestions) {
    for (const fileChange of suggestion.fileChanges) {
      // Get current file content
      let currentContent = '';
      try {
        const { data: file } = await github.rest.repos.getContent({
          ...ctx.repo,
          path: fileChange.path,
          ref: branchName,
        });

        if ('content' in file) {
          currentContent = Buffer.from(file.content, 'base64').toString();
        }
      } catch (error) {
        // File might not exist, which is fine for new files
        console.log(`File ${fileChange.path} not found, creating new file`);
      }

      // Apply the change
      const updatedContent = fileChange.newContent || currentContent;

      // Get the current file SHA if it exists
      let fileSha: string | undefined;
      if (currentContent) {
        try {
          const { data: fileData } = await github.rest.repos.getContent({
            ...ctx.repo,
            path: fileChange.path,
            ref: branchName,
          });

          if ('sha' in fileData) {
            fileSha = fileData.sha;
          }
        } catch (error) {
          console.log(`Could not get SHA for ${fileChange.path}, treating as new file`);
        }
      }

      // Update the file
      await github.rest.repos.createOrUpdateFileContents({
        ...ctx.repo,
        path: fileChange.path,
        message: `${suggestion.category}: ${fileChange.description}`,
        content: Buffer.from(updatedContent).toString('base64'),
        branch: branchName,
        sha: fileSha,
      });
    }

    changesSummary.push(`- **${suggestion.category}**: ${suggestion.description}`);
  }

  // Create the pull request
  const prTitle = `feat: Automated code suggestions for ${appName}`;
  const prBody = `## Automated Code Suggestions

This PR contains automated code suggestions to improve the ${appName} app.

### Changes Made:
${changesSummary.join('\n')}

### Review Notes:
- These suggestions are automatically generated based on best practices
- Please review each change carefully before merging
- Feel free to modify or reject any suggestions that don't fit your needs

---
*This PR was created automatically by the Automated Code Suggestions workflow.*`;

  try {
    const { data: pr } = await github.rest.pulls.create({
      ...ctx.repo,
      title: prTitle,
      head: branchName,
      base: 'main',
      body: prBody,
    });

    console.log(`Created PR #${pr.number} for ${appName}: ${pr.html_url}`);

    // Add a label to identify automated suggestions
    await github.rest.issues.addLabels({
      ...ctx.repo,
      issue_number: pr.number,
      labels: ['automated-suggestions', 'enhancement'],
    });
  } catch (error) {
    console.error(`Failed to create PR for ${appName}:`, error);

    // Clean up the branch if PR creation failed
    try {
      await github.rest.git.deleteRef({
        ...ctx.repo,
        ref: `heads/${branchName}`,
      });
    } catch (cleanupError) {
      console.error(`Failed to clean up branch ${branchName}:`, cleanupError);
    }
  }
}

export { analyzeSuggestAndCreate };

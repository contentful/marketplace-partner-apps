#!/bin/bash

# Define the standard content for the new files
VITE_CONFIG_CONTENT=$(
  cat <<EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '', // relative paths
  build: {
    outDir: 'build'
  },
  plugins: [
    react(),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './test/vite.setup.ts'
  }
});
EOF
)

VITE_CONFIG_WITH_EMOTION_CONTENT=$(
  cat <<EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '', // relative paths
  build: {
    outDir: 'build'
  },
  plugins: [
    react({ jsxImportSource: '@emotion/react' }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './test/vite.setup.ts'
  }
});
EOF
)

VITE_ENV_CONTENT=$(
  cat <<EOF
/// <reference types='vite/client' />
EOF
)

TEST_SETUP_CONTENT=$(
  cat <<EOF
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-test-id',
});
EOF
)

TEST_SETUP_WITH_JEST_DOM_CONTENT=$(
  cat <<EOF
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-test-id',
});
EOF
)

# Path to the reference tsconfig.json file
REFERENCE_TSCONFIG="../../bin/reference-tsconfig.json"

# Iterate over each project
npx nx reset && npx lerna exec --concurrency 1 --no-bail -- bash -c '
if [ -f package.json ] && jq -e ".dependencies[\"react-scripts\"] // .devDependencies[\"react-scripts\"]" package.json > /dev/null; then
  # copy the .npmrc file from the root to this project
  cp ../../.npmrc .npmrc

  # Blow away node_modules
  rm -rf node_modules

  # Remove react-scripts from dependencies or devDependencies
  jq "del(.dependencies[\"react-scripts\"] // .devDependencies[\"react-scripts\"])" package.json > tmp.json && mv tmp.json package.json

  # Remove jest from dependencies or devDependencies
  jq "del(.dependencies[\"jest\"] // .devDependencies[\"jest\"])" package.json > tmp.json && mv tmp.json package.json

  # Remove the jest configuration from the package.json
  jq "del(.jest)" package.json > tmp.json && mv tmp.json package.json 

  # Remove react-scripts eject script
  jq "del(.scripts.eject)" package.json > tmp.json && mv tmp.json package.json

  # Remove cross-env from dependencies or devDependencies
  jq "del(.dependencies[\"cross-env\"] // .devDependencies[\"cross-env\"])" package.json > tmp.json && mv tmp.json package.json

  # Check if the project has a dependency on emotion
  if jq -e \".dependencies[\\\"emotion\\\"] // .devDependencies[\\\"emotion\\\"]\" package.json > /dev/null; then
    npm uninstall emotion
    npm install @emotion/css
  fi

  # Add vite, vitest, @vitejs/plugin-react, and happy-dom as devDependencies
  npm install --save-dev vite vitest @vitejs/plugin-react happy-dom @testing-library/react --ignore-scripts

  # Replace instances of "jest." with "vi." in all files within the test and src folders
  find test src -type f -exec sed -i "" "s/jest\\./vi\\./g" {} + 

  # Copy the reference tsconfig.json to the project
  cp '"$REFERENCE_TSCONFIG"' tsconfig.json
  
  # create the vite config file
  # if @emotion/react is a dependency, use the VITE_CONFIG_WITH_EMOTION_CONTENT
  if jq -e ".dependencies[\"@emotion/react\"]" package.json > /dev/null; then
    printf "%s\n" "'"$VITE_CONFIG_WITH_EMOTION_CONTENT"'" > vite.config.js
  else
    printf "%s\n" "'"$VITE_CONFIG_CONTENT"'" > vite.config.js
  fi

  # Append contents of react-app-env.d.ts to vite-env.d.ts if it exists
  if [ -f src/react-app-env.d.ts ]; then
    # Create vite-env.d.ts in the src directory
      printf "%s\n" "'"$VITE_ENV_CONTENT"'" > src/vite-env.d.ts
      cat src/react-app-env.d.ts >> src/vite-env.d.ts
      # Remove the string "/// <reference types=\"react-scripts\" />" from vite-env.d.ts
      sed -i "" "/\/\/\/ <reference types=\"react-scripts\" \/>/d" src/vite-env.d.ts
      rm -f src/react-app-env.d.ts
  fi

  if [ -f react-app-env.d.ts ]; then
      # Create vite-env.d.ts at the root
      printf "%s\n" "'"$VITE_ENV_CONTENT"'" > vite-env.d.ts
      cat react-app-env.d.ts >> vite-env.d.ts
      # Remove the string "/// <reference types=\"react-scripts\" />" from vite-env.d.ts
      sed -i "" "/\/\/\/ <reference types=\"react-scripts\" \/>/d" vite-env.d.ts
      rm -f react-app-env.d.ts
  fi

  # Create vite.setup.ts in the test folder
  mkdir -p test
  if jq -e ".dependencies[\"@testing-library/jest-dom\"]" package.json > /dev/null; then
    printf "%s\n" "'"$TEST_SETUP_WITH_TEST_LIBRARY_CONTENT"'" > test/vite.setup.ts
    jq ".compilerOptions.types += [\"@testing-library/jest-dom\"]" tsconfig.json > tmp.json && mv tmp.json tsconfig.json
  else
    printf "%s\n" "'"$TEST_SETUP_CONTENT"'" > test/vite.setup.ts
  fi

  # remove src/setupTests.ts if it exists
  rm -f src/setupTests.ts

  # Replace the start, test, and build scripts in package.json
  jq ".scripts.start = \"vite\" | .scripts.test = \"vitest run --passWithNoTests\" | .scripts.build = \"rm -rf build && tsc && vite build\"" package.json > tmp.json && mv tmp.json package.json

  # if a public folder exists, move the contents to the src folder and remove the public folder
  if [ -d public ]; then
    mv public/* .
    rm -rf public
  fi

  # replace any index.html files with the contents of ../../bin/reference-index.html
  cp ../../bin/reference-index.html index.html

  npm audit fix

  npm ci
fi'

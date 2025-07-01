#!/bin/bash

# Build script that ensures packages are built before apps
# This will work both in the current monorepo and when packages are moved to their own repo

set -e

echo "Building packages first..."

# Build the contentful-app-components package
echo "Building @contentful/app-components..."
cd packages/contentful-app-components
npm run build
cd ../..

# Install the package in the app
echo "Installing @contentful/app-components in lottie-preview..."
cd apps/lottie-preview
npm install
cd ../..

# Now build the apps
echo "Building apps..."
cd apps/lottie-preview
npm run build
cd ../..

echo "Build complete!" 
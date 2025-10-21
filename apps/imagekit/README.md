[<img width="250" alt="ImageKit.io" src="https://raw.githubusercontent.com/imagekit-developer/imagekit-javascript/master/assets/imagekit-light-logo.svg"/>](https://imagekit.io)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Contentful](https://img.shields.io/badge/Contentful-2478CC?logo=contentful&logoColor=white)](https://www.contentful.com/)

# ImageKit App for Contentful

Seamlessly integrate ImageKit's powerful media management with your Contentful workflows.

---

## Table of Contents

- [ImageKit App for Contentful](#imagekit-app-for-contentful)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
    - [🎯 Core Features](#-core-features)
    - [🔧 Advanced Features](#-advanced-features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [Basic Setup](#basic-setup)
    - [Advanced Configuration](#advanced-configuration)
      - [Media Delivery Settings](#media-delivery-settings)
      - [Widget Settings](#widget-settings)
  - [Usage](#usage)
    - [Adding ImageKit Fields to Content Types](#adding-imagekit-fields-to-content-types)
    - [Selecting Assets](#selecting-assets)
  - [Support](#support)
    - [Official Support Channels](#official-support-channels)
    - [Community Support](#community-support)
  - [License](#license)

## Overview

The **ImageKit App** for Contentful enables content creators to seamlessly select, upload, and manage media assets from their ImageKit Media Library directly within Contentful's interface. This integration combines ImageKit's powerful image and video optimization capabilities with Contentful's flexible content management system.

## Features

### 🎯 Core Features

- **Media Library Integration**: Browse and select assets from your ImageKit Media Library
- **Direct Upload**: Upload new assets to ImageKit from within Contentful
- **Real-time Transformations**: Apply transformations and quality settings automatically
- **Drag & Drop Reordering**: Easily reorder selected assets
- **Rich Metadata**: Access comprehensive asset information including dimensions, file size, tags, and more
- **Preview Support**: View thumbnails and preview assets before selection

### 🔧 Advanced Features

- **Custom Transformations**: Apply default transformation strings to all selected assets
- **Quality Control**: Set specific quality levels for optimized delivery
- **Folder Navigation**: Start in specific folders within your media library
- **Collection Support**: Filter by specific collections or view all collections
- **File Type Filtering**: Show only specific file types (image, video, etc.)
- **Search Integration**: Default search queries for faster asset discovery within the media library
- **Multiple Selection**: Select multiple assets at once with configurable limits

## Prerequisites

Before installing this app, ensure you have:

1. **Active ImageKit Account**: Sign up at [imagekit.io](https://imagekit.io) if you haven't already
2. **Contentful Space**: Administrative access to a Contentful space where you want to install the app
3. **Content Types**: At least one content type where you want to use the media field

## Installation

The easiest and the recommended way to install this app is from the Contentful official marketplace.

1. Go to your Contentful space
2. Navigate to **Apps** → **Marketplace**
3. Search for "ImageKit App"
4. Click **Install** and follow the setup wizard

## Configuration

### Basic Setup

After installation, configure the app through Contentful's interface:

1. **Navigate to App Configuration**:
   - Go to **App** → **Installed apps**
   - Find "ImageKit App" and click **Configure**

2. **Complete the Setup Wizard**:
   - **Field Selection**: Choose which content types and fields will use ImageKit
   - **Basic Configuration**: This will be automatically set up during the configuration process

### Advanced Configuration

The app provides extensive configuration options to customize behavior:

#### Media Delivery Settings

Configure how selected media assets are delivered:

| Setting | Description | Default | Example |
|---------|-------------|---------|---------|
| **Default Transformation** | Transformation string applied to all selected assets | None | `w-400,h-300,c-maintain_ratio` |
| **Media Quality** | Quality level for image compression | Uses ImageKit Defaults | `80`, `70` |

#### Widget Settings

Control the media library widget's initial state:

| Setting | Description | Default | Example |
|---------|-------------|---------|---------|
| **Starting Folder** | Default folder path when widget opens | `/` | `/marketing/banners/` |
| **Collection ID** | Specific collection to display | None | `col_123456` or `all` |
| **File Type Filter** | Restrict to specific file types | None | `image`, `video`, `others` |
| **Default Search** | Pre-filled search query | None | `name = "red-dress-summer.jpg"` |
| **Multiple Selection** | Allow selecting multiple assets | `true` | `false` |
| **Max Selections** | Maximum number of assets per selection | Unlimited | `5` |

## Usage

### Adding ImageKit Fields to Content Types

1. **Open Content Type**:
   - Navigate to **Content model** → Select your content type
   - Click **Add field**

2. **Select Field Type**:
   - Choose **JSON Object**
   - Set field name (e.g., "Hero Image", "Gallery Images")
   - Configure validation rules as needed

3. **Configure Field**:
   - In the **Appearance** tab, select "ImageKit App"
   - The field will now use the ImageKit media library widget

### Selecting Assets

1. **Open Entry Editor**:
   - Navigate to **Content** → Select an entry
   - Find your ImageKit field

2. **Select Assets**:
   - Click **"Select or upload an asset"**
   - Browse your ImageKit Media Library
   - Use search, filters, and folder navigation
   - Select desired assets and click **Insert**

3. **Manage Selected Assets**:
   - **Reorder**: Drag and drop assets to reorder
   - **Preview**: Click on assets to see details and preview
   - **Remove**: Use the delete button to remove assets
   - **View on ImageKit**: Click to open the asset in ImageKit dashboard

## Support

### Official Support Channels

- **ImageKit Support**: For ImageKit-specific issues, contact [ImageKit Support](https://imagekit.io/support)
- **Contentful Support**: For Contentful platform issues, contact [Contentful Support](https://support.contentful.com)

### Community Support

- **GitHub Issues**: Report bugs or request features in our [GitHub repository](https://github.com/imagekit-developer/imagekit-contentful-app/issues)
- **Documentation**: Check our comprehensive documentation above
- **StackOverflow**: Tag questions with `imagekit` and `contentful`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# URL Shortener Web Application

A React-based URL shortener application that allows users to create shortened URLs with custom options and analytics.

## 🚀 Live Demo

**[Try the live application here!](https://url-shortner-khped1dig-abhay030s-projects.vercel.app)**

Deployed on Vercel with automatic HTTPS and global CDN.

## Features

- **Concurrent URL Shortening**: Shorten up to 5 URLs simultaneously
- **Custom Shortcodes**: Optional custom shortcodes for personalized links
- **Validity Control**: Set custom expiry times (default: 30 minutes)
- **Client-side Routing**: Handle redirections within the React application
- **Extensive Logging**: Comprehensive logging system for all operations
- **Material UI Design**: Modern, responsive user interface
- **Error Handling**: Robust client-side validation and error management

## Requirements

- Node.js (v14 or higher)
- npm or yarn package manager

## Installation

1. Navigate to the project directory:
```bash
cd \Desktop\2201641520201
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will run on `http://localhost:3000`

## Usage

### URL Shortener Page (/)

1. Enter up to 5 URLs you want to shorten
2. For each URL, optionally specify:
   - Validity period (in minutes, default: 30)
   - Custom shortcode (3-10 alphanumeric characters)
3. Click "Shorten URLs" to process all entries
4. View results with shortened URLs and expiry dates
5. Copy shortened URLs to clipboard

### URL Redirection

- Access any shortened URL (e.g., `http://localhost:3000/abc123`)
- The app will redirect you to the original URL
- Expired URLs will show an error message

## Technical Architecture

### Components

- **URLShortener**: Main component for creating shortened URLs
- **RedirectHandler**: Handles URL redirection and validation
- **App**: Main application with routing configuration

### Utilities

- **logger.js**: Comprehensive logging middleware
- **urlStorage.js**: URL storage and management system

### Key Features

- **Uniqueness Management**: Ensures all shortcodes are unique
- **Expiry Handling**: Automatic cleanup of expired URLs
- **Client-side Validation**: Real-time input validation
- **Local Storage**: Persistent storage of URL mappings
- **Error Recovery**: Graceful error handling and user feedback

## Logging

The application uses extensive logging for all operations:
- URL creation and validation
- Redirection attempts
- Error conditions
- User interactions

All logs are captured with timestamps and contextual information.

## Constraints

- Maximum 5 concurrent URL entries
- Shortcodes: 3-10 alphanumeric characters
- URLs must start with http:// or https://
- Validity periods must be positive integers (minutes)
- Application runs exclusively on localhost:3000

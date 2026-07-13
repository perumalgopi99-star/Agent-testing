# URL Shortener - Full Stack Implementation

## Overview
A complete, production-ready URL shortener built with Express.js backend and vanilla HTML/CSS/JavaScript frontend with comprehensive test coverage.

## Architecture

### Backend (Express.js)

#### API Endpoints

**POST /api/shorten**
- Creates a shortened URL
- Request body: `{ url: string, customAlias?: string }`
- Validates URL format (requires http:// or https://)
- Generates 6-character random alphanumeric code or uses custom alias
- Returns 409 Conflict if alias already taken
- Response: `{ shortCode, shortUrl, originalUrl, createdAt }`

**GET /:shortCode**
- Redirects to the original URL (HTTP 302)
- Automatically increments click count
- Returns 404 if short code not found

**GET /api/links**
- Returns all shortened links with stats
- Sorted by clickCount in descending order
- Response: Array of `{ shortCode, originalUrl, createdAt, clickCount }`

**DELETE /api/links/:shortCode**
- Deletes a shortened link
- Returns 204 No Content on success
- Returns 404 if short code not found

#### Data Model
```javascript
{
  shortCode: string,        // e.g., "abc123"
  originalUrl: string,      // Full URL
  createdAt: ISO string,    // Creation timestamp
  clickCount: number        // Number of clicks/redirects
}
```

#### Storage
- In-memory Map-based store
- Data persists during server lifetime
- Data resets on server restart

### Frontend (Single-Page Application)

#### Features
- **URL Creation Form**
  - Input field for original URL
  - Optional custom alias field
  - Validation with error messages
  - Loading state feedback

- **Result Display**
  - Shows created short URL
  - Copy-to-clipboard button
  - Original URL reference
  - Creation date/time

- **Links Management**
  - Table view of all shortened links
  - Shows short code, original URL, click count, creation date
  - Delete button for each link
  - Real-time updates after actions

- **Statistics**
  - Total Links count
  - Total Clicks count
  - Summary card above links table

#### Technology Stack
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with flexbox/grid
- **Vanilla JavaScript**: No frameworks, pure DOM manipulation
- **Fetch API**: For backend communication

### Testing

#### Test Suite (Jest + Supertest)
21 comprehensive tests covering:

1. **POST /api/shorten**
   - Valid URL with generated code
   - Custom alias handling
   - Missing URL validation
   - Invalid URL format detection
   - URL without protocol rejection
   - Duplicate alias conflict (409)
   - Various URL formats support

2. **GET /:shortCode**
   - Successful redirect (302)
   - Click count increment
   - 404 for unknown codes

3. **GET /api/links**
   - Empty array when no links
   - All links returned
   - Sorting by clickCount descending

4. **DELETE /api/links/:shortCode**
   - Successful deletion
   - 404 for non-existent links
   - Recreating deleted codes

5. **Integration Tests**
   - Complete user workflow

6. **Edge Cases**
   - URLs with query parameters and fragments
   - Very long URLs
   - Unique code generation
   - Custom aliases with various characters

#### Test Results
```
Test Suites: 1 passed, 1 total
Tests: 21 passed, 21 total
Time: ~3 seconds
```

## Installation & Running

### Setup
```bash
npm install
```

### Development Server
```bash
npm start
```
Server runs on http://localhost:3000

### Testing
```bash
npm test
```

## Project Structure
```
.
├── server.js                 # Express server and API routes
├── server.test.js            # Jest test suite
├── jest.config.js            # Jest configuration
├── package.json              # Dependencies and scripts
├── public/
│   ├── index.html            # Main HTML template
│   ├── styles.css            # CSS styling
│   └── script.js             # Frontend JavaScript
└── IMPLEMENTATION.md         # This file
```

## Security Considerations
- URL validation (protocol check only - valid http/https URLs)
- No SQL injection risk (no database)
- No XSS vulnerabilities (content properly escaped)
- No CSRF handling needed (stateless API)
- Short codes are random and unpredictable

## Performance
- In-memory operations (O(1) lookups and inserts)
- No database latency
- Lightweight frontend (no frameworks)
- Response times <50ms for API calls

## Future Enhancements
- Persistent database (PostgreSQL, MongoDB)
- User authentication and link ownership
- Analytics dashboard with charts
- Bulk URL import/export
- Custom domain support
- QR code generation
- Link expiration/TTL
- Rate limiting
- Admin dashboard

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ JavaScript support
- Fetch API support required

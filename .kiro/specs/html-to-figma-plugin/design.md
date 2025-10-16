# Design Document

## Overview

The HTML to Figma plugin will scrape entire websites and convert them into Figma designs. Users input a URL, and the plugin fetches the complete webpage (HTML, CSS, images, fonts) and recreates it as a pixel-perfect Figma design with proper layers and components.

## Architecture

The plugin uses a three-tier architecture to handle website scraping, processing, and Figma conversion:

1. **UI Layer (iframe)**: URL input and progress display
2. **Scraping Service**: Fetches and processes website content
3. **Main Thread (sandbox)**: Creates Figma nodes from processed data

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Plugin UI     │    │  Scraping Service│    │   Main Thread    │
│   (iframe)      │◄──►│   (backend)      │◄──►│   (sandbox)      │
│                 │    │                  │    │                  │
│ - URL Input     │    │ - Website Fetch  │    │ - Layer Creator  │
│ - Progress UI   │    │ - Asset Download │    │ - Image Handler  │
│ - Preview       │    │ - DOM Analysis   │    │ - Text Processor │
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

## Components and Interfaces

### Website Scraper Component
- **Purpose**: Fetch complete website content including all assets
- **Input**: Website URL
- **Output**: Complete website data with computed styles and assets
- **Features**:
  - Full page HTML retrieval
  - CSS file fetching and parsing
  - Image and font asset downloading
  - JavaScript execution for dynamic content
  - Responsive breakpoint capture

### DOM Analyzer Component
- **Purpose**: Analyze the rendered webpage and extract visual elements
- **Input**: Rendered DOM with computed styles
- **Output**: Layer hierarchy with precise positioning and styling
- **Technology**: Headless browser (Puppeteer/Playwright) for accurate rendering
- **Key Features**:
  - Element bounding box calculation
  - Z-index and stacking context analysis
  - Text content and styling extraction
  - Background image and gradient detection

### Asset Manager Component
- **Purpose**: Download and process all website assets
- **Input**: Asset URLs from HTML/CSS
- **Output**: Base64 encoded assets ready for Figma
- **Supported Assets**:
  - Images (PNG, JPG, SVG, WebP)
  - Fonts (WOFF, WOFF2, TTF)
  - Background images and patterns
  - Icons and logos

### Figma Layer Generator Component
- **Purpose**: Convert analyzed website elements to Figma layers
- **Input**: Processed website data with positioning and styles
- **Output**: Figma document with accurate layer recreation
- **Layer Strategy**:
  - Page frame matching viewport size
  - Nested frames for layout containers
  - Text layers with proper typography
  - Image fills for visual elements
  - Auto-layout where applicable

### Plugin UI Component
- **Purpose**: Simple interface for URL input and conversion progress
- **Features**:
  - URL input field with validation
  - Real-time progress tracking
  - Preview thumbnail generation
  - Error handling and retry options
  - Conversion settings (viewport size, quality)

## Data Models

### WebsiteData Interface
```typescript
interface WebsiteData {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  elements: VisualElement[];
  assets: AssetCollection;
  fonts: FontCollection;
}
```

### VisualElement Interface
```typescript
interface VisualElement {
  id: string;
  tagName: string;
  bounds: BoundingBox;
  styles: ComputedStyles;
  textContent?: string;
  backgroundImage?: string;
  children: VisualElement[];
  zIndex: number;
}
```

### BoundingBox Interface
```typescript
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### ComputedStyles Interface
```typescript
interface ComputedStyles {
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  borderRadius?: number;
  boxShadow?: string;
  opacity?: number;
  transform?: string;
}
```

### AssetCollection Interface
```typescript
interface AssetCollection {
  images: Map<string, string>; // URL -> base64
  backgrounds: Map<string, string>;
  icons: Map<string, string>;
}
```

### FigmaLayer Interface
```typescript
interface FigmaLayer {
  type: 'FRAME' | 'TEXT' | 'RECTANGLE' | 'GROUP';
  name: string;
  bounds: BoundingBox;
  fills?: Paint[];
  strokes?: Paint[];
  effects?: Effect[];
  fontName?: FontName;
  characters?: string;
  children?: FigmaLayer[];
}
```

## Error Handling

### URL and Network Errors
- Validate URL format and accessibility
- Handle network timeouts and connection failures
- Manage CORS restrictions and blocked resources
- Retry failed asset downloads with exponential backoff

### Website Loading Errors
- Handle JavaScript-heavy sites that require rendering time
- Manage authentication-required pages
- Deal with infinite scroll and dynamic content
- Handle mobile-only or responsive-only sites

### Asset Processing Errors
- Handle unsupported image formats gracefully
- Manage large file size limits
- Convert incompatible fonts to system alternatives
- Provide fallbacks for missing or broken assets

### Figma Conversion Errors
- Handle Figma document size and node limits
- Manage complex CSS properties not supported by Figma
- Handle font loading and availability issues
- Provide simplified fallbacks for complex layouts

## Testing Strategy

### Unit Tests
- Website scraping accuracy with different site types
- Asset downloading and processing
- DOM analysis and element extraction
- Figma layer generation with various element types

### Integration Tests
- End-to-end website to Figma conversion
- Plugin UI workflow from URL input to completion
- Asset management and optimization
- Performance with complex websites

### Manual Testing
- Test with popular websites (landing pages, e-commerce, blogs)
- Verify visual accuracy and layer organization
- Test responsive design handling
- Cross-browser plugin compatibility
- Performance testing with large, complex sites

## Implementation Considerations

### Performance
- Headless browser optimization for fast rendering
- Parallel asset downloading and processing
- Efficient Figma node creation with batching
- Real-time progress updates during conversion
- Caching of processed websites for re-conversion

### Technical Challenges
- Accurate recreation of complex CSS layouts
- Handling of dynamic content and animations
- Font matching between web fonts and Figma fonts
- Maintaining visual fidelity across different screen sizes
- Managing large websites with hundreds of elements

### Limitations
- Static snapshot only (no interactive elements)
- Figma's node and document size constraints
- Limited support for advanced CSS features (3D transforms, filters)
- Font licensing and availability restrictions
- CORS limitations for certain websites

### Security and Privacy
- Safe website scraping without executing malicious code
- Secure asset downloading and validation
- User privacy protection (no data storage)
- Rate limiting to prevent abuse
- Compliance with website terms of service

### Scalability
- Backend service for heavy scraping operations
- Queue system for handling multiple conversion requests
- CDN integration for asset optimization
- Monitoring and analytics for usage patterns

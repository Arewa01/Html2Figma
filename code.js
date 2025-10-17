// HTML to Figma Plugin - Main Thread Code

// Configuration
const CONFIG = {
    // Backend URL configuration
    // IMPORTANT: Update this URL after deploying your backend service
    // For development: use 'http://localhost:3000'
    // For production: replace with your actual deployment URL
    BACKEND_URL: 'http://localhost:4000', // Change this to your deployed backend URL
    REQUEST_TIMEOUT: 60000, // 60 seconds
    MAX_RETRIES: 2,
    IMAGE_PROCESSING: {
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB max image size
        SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        TIMEOUT: 10000, // 10 seconds for image downloads
        MAX_CONCURRENT_DOWNLOADS: 5, // Maximum parallel image downloads
        BATCH_SIZE: 3 // Images to process in each batch
    },
    PERFORMANCE: {
        NODE_BATCH_SIZE: 15, // Nodes to create in each batch
        BATCH_DELAY: 20, // Milliseconds between batches
        PROGRESS_UPDATE_INTERVAL: 100, // Milliseconds between progress updates
        MAX_PROCESSING_TIME: 300000, // 5 minutes max processing time
        MEMORY_CLEANUP_INTERVAL: 50 // Clean up every N batches
    }
};

// Show the plugin UI
figma.showUI(__html__, {
    width: 400,
    height: 500,
    themeColors: true
});

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
    console.log('Received message:', msg.type);

    switch (msg.type) {
        case 'convert-website':
            await handleWebsiteConversion(msg.url, msg.viewport);
            break;

        case 'test-backend':
            const isAvailable = await testBackendConnection();
            figma.ui.postMessage({
                type: 'backend-status',
                available: isAvailable,
                url: CONFIG.BACKEND_URL
            });
            break;

        case 'cancel':
            figma.closePlugin();
            break;

        default:
            console.log('Unknown message type:', msg.type);
    }
};

// Test backend connection when plugin loads
(async () => {
    const isBackendAvailable = await testBackendConnection();
    figma.ui.postMessage({
        type: 'backend-status',
        available: isBackendAvailable,
        url: CONFIG.BACKEND_URL
    });
})();

// Handle website conversion
async function handleWebsiteConversion(url, viewport = { width: 1200, height: 800 }) {
    try {
        // Send progress update
        figma.ui.postMessage({
            type: 'progress',
            message: 'Starting website scraping...',
            progress: 10
        });

        // Call backend scraping service
        const websiteData = await scrapeWebsite(url, viewport);

        figma.ui.postMessage({
            type: 'progress',
            message: 'Processing website elements...',
            progress: 50
        });

        // Convert backend data format to our node creation format
        const convertedData = convertBackendDataToNodeFormat(websiteData, url, viewport);

        figma.ui.postMessage({
            type: 'progress',
            message: 'Creating Figma nodes...',
            progress: 70
        });

        // Use the node creation system
        const result = await createFigmaNodesFromWebsiteData(convertedData);

        figma.ui.postMessage({
            type: 'progress',
            message: 'Finalizing design...',
            progress: 90
        });

        // Send completion message with enhanced statistics
        figma.ui.postMessage({
            type: 'complete',
            message: `Website conversion completed! Created ${result.totalElements} elements.`,
            progress: 100,
            stats: {
                totalElements: result.totalElements,
                imagesProcessed: result.imagesProcessed || 0,
                failedElements: result.failedElements || 0,
                conversionTime: result.conversionTime || 0,
                performanceReport: result.performanceReport
            }
        });

    } catch (error) {
        console.error('Conversion error:', error);

        // Provide user-friendly error messages
        let userMessage = 'Failed to convert website';
        if (error.message.includes('network')) {
            userMessage = 'Network error - please check your internet connection';
        } else if (error.message.includes('timeout')) {
            userMessage = 'Website took too long to load - please try again';
        } else if (error.message.includes('invalid')) {
            userMessage = 'Invalid URL - please check the website address';
        } else if (error.message.includes('unreachable')) {
            userMessage = 'Website is unreachable - please check the URL';
        }

        // Use enhanced error categorization
        const errorInfo = categorizeError(error);

        figma.ui.postMessage({
            type: 'error',
            message: errorInfo.userMessage,
            details: errorInfo.details,
            canRetry: errorInfo.canRetry,
            suggestions: errorInfo.suggestions
        });
    }
}

/**
 * Categorize errors and provide user-friendly messages
 */
function categorizeError(error) {
    const errorMessage = error.message.toLowerCase();

    // Network-related errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return {
            userMessage: 'Network Connection Error',
            details: 'Unable to connect to the scraping service. Please check your internet connection.',
            canRetry: true,
            suggestions: [
                'Check your internet connection',
                'Ensure the backend service is running',
                'Try again in a few moments'
            ]
        };
    }

    // Timeout errors
    if (errorMessage.includes('timeout')) {
        return {
            userMessage: 'Request Timeout',
            details: 'The website took too long to load or process.',
            canRetry: true,
            suggestions: [
                'Try a simpler website first',
                'Check if the website is responsive',
                'Try again with a smaller viewport size'
            ]
        };
    }

    // Invalid URL errors
    if (errorMessage.includes('invalid')) {
        return {
            userMessage: 'Invalid Input',
            details: 'Please check the URL format and try again.',
            canRetry: false,
            suggestions: [
                'Ensure the URL starts with http:// or https://',
                'Check for typos in the URL',
                'Try a different website'
            ]
        };
    }

    // Website unreachable
    if (errorMessage.includes('unreachable') || errorMessage.includes('404') || errorMessage.includes('not found')) {
        return {
            userMessage: 'Website Not Found',
            details: 'The website could not be reached or does not exist.',
            canRetry: false,
            suggestions: [
                'Check the URL for typos',
                'Verify the website is online',
                'Try a different URL'
            ]
        };
    }

    // Scraping errors
    if (errorMessage.includes('scraping')) {
        return {
            userMessage: 'Content Processing Error',
            details: 'Unable to extract content from the website.',
            canRetry: true,
            suggestions: [
                'The website might require JavaScript to load content',
                'Try a different page on the same website',
                'Some websites block automated access'
            ]
        };
    }

    // Generic errors
    return {
        userMessage: 'Conversion Error',
        details: 'An unexpected error occurred during conversion.',
        canRetry: true,
        suggestions: [
            'Try again in a few moments',
            'Try a different website',
            'Check the browser console for more details'
        ]
    };
}

/**
 * Scrape website using backend service with enhanced timeout handling
 */
async function scrapeWebsite(url, viewport, retryCount = 0) {
    const startTime = Date.now();

    try {
        figma.ui.postMessage({
            type: 'progress',
            message: retryCount > 0 ? `Retrying connection (${retryCount}/${CONFIG.MAX_RETRIES})...` : 'Connecting to scraping service...',
            progress: 20
        });

        // Create abort controller with progressive timeout
        const controller = new AbortController();
        const timeoutDuration = CONFIG.REQUEST_TIMEOUT * (1 + retryCount * 0.5); // Increase timeout on retries
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

        // Add timeout warning for slow websites
        const warningTimeoutId = setTimeout(() => {
            figma.ui.postMessage({
                type: 'progress',
                message: 'Website is taking longer than expected to load...',
                progress: 25
            });
        }, 15000);

        const response = await fetch(`${CONFIG.BACKEND_URL}/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                viewport: viewport,
                timeout: timeoutDuration // Pass timeout to backend
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        clearTimeout(warningTimeoutId);

        const elapsedTime = Date.now() - startTime;
        console.log(`Scraping request completed in ${elapsedTime}ms`);

        figma.ui.postMessage({
            type: 'progress',
            message: 'Processing scraped content...',
            progress: 40
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Scraping failed');
        }

        // Log performance metrics
        console.log(`Scraped ${result.data.elements?.length || 0} elements in ${elapsedTime}ms`);

        return result.data;

    } catch (error) {
        console.error('Backend scraping error:', error);

        // Handle different types of errors with enhanced retry logic
        if (error.name === 'AbortError') {
            if (retryCount < CONFIG.MAX_RETRIES) {
                console.log(`Request timeout, retrying... (${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
                // Exponential backoff for retries
                const backoffDelay = Math.min(2000 * Math.pow(2, retryCount), 10000);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                return await scrapeWebsite(url, viewport, retryCount + 1);
            }
            throw new Error('timeout: Website took too long to load after multiple attempts. Try a simpler page or check if the website is responsive.');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            if (retryCount < CONFIG.MAX_RETRIES) {
                console.log(`Network error, retrying... (${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
                // Progressive delay for network errors
                const networkDelay = 2000 + (retryCount * 1000);
                await new Promise(resolve => setTimeout(resolve, networkDelay));
                return await scrapeWebsite(url, viewport, retryCount + 1);
            }
            throw new Error('network: Unable to connect to scraping service. Please ensure the backend is running.');
        } else if (error.message.includes('unreachable')) {
            throw new Error('unreachable: Website is not accessible');
        } else if (error.message.includes('Invalid URL')) {
            throw new Error('invalid: Please provide a valid URL');
        } else {
            throw error;
        }
    }
}

/**
 * Test backend service connectivity
 */
async function testBackendConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${CONFIG.BACKEND_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            console.log('Backend service is available:', data);
            return true;
        } else {
            console.warn('Backend service returned error:', response.status);
            return false;
        }
    } catch (error) {
        console.warn('Backend service is not available:', error.message);
        return false;
    }
}

/**
 * Convert backend data format to our node creation system format
 */
function convertBackendDataToNodeFormat(backendData, originalUrl, viewport) {
    // Convert flat element list to hierarchical structure
    const elements = backendData.elements.map(element => ({
        id: element.id,
        tagName: element.tagName.toUpperCase(),
        textContent: element.textContent,
        bounds: element.bounds,
        src: element.src, // For IMG elements
        styles: {
            backgroundColor: element.styles.backgroundColor,
            color: element.styles.color,
            fontSize: element.styles.fontSize,
            fontFamily: element.styles.fontFamily,
            fontWeight: element.styles.fontWeight,
            fontStyle: element.styles.fontStyle,
            lineHeight: element.styles.lineHeight,
            textAlign: element.styles.textAlign,
            textDecoration: element.styles.textDecoration,
            textTransform: element.styles.textTransform,
            letterSpacing: element.styles.letterSpacing,
            borderRadius: element.styles.borderRadius,
            border: element.styles.border,
            boxShadow: element.styles.boxShadow,
            opacity: element.styles.opacity,
            backgroundImage: element.backgroundImage,
            backgroundGradient: element.backgroundGradient,
            backgroundProperties: element.backgroundProperties
        },
        children: [] // Backend provides flat structure, we'll organize later if needed
    }));

    return {
        url: originalUrl,
        title: backendData.title || 'Converted Website',
        viewport: viewport,
        elements: elements,
        assets: {
            images: new Map(),
            backgrounds: new Map(),
            icons: new Map()
        },
        fonts: extractFontsFromElements(elements)
    };
}

/**
 * Extract unique fonts from elements for font loading
 */
function extractFontsFromElements(elements) {
    const fonts = {};

    elements.forEach(element => {
        if (element.styles.fontFamily) {
            const fontFamily = element.styles.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
            if (!fonts[fontFamily]) {
                fonts[fontFamily] = ['Regular'];
            }

            // Add font weight variations
            const weight = element.styles.fontWeight;
            if (weight && weight !== 'normal' && weight !== '400') {
                if (weight === 'bold' || weight === '700') {
                    if (!fonts[fontFamily].includes('Bold')) {
                        fonts[fontFamily].push('Bold');
                    }
                } else if (weight === '500' || weight === 'medium') {
                    if (!fonts[fontFamily].includes('Medium')) {
                        fonts[fontFamily].push('Medium');
                    }
                }
            }
        }
    });

    return fonts;
}

/**
 * Create mock website data for testing the node creation system
 * This will be replaced with actual scraped data in task 6
 */
function createMockWebsiteData(url, viewport) {
    return {
        url: url,
        title: 'Sample Website',
        viewport: viewport,
        elements: [
            // Header section
            {
                id: 'header',
                tagName: 'HEADER',
                bounds: { x: 0, y: 0, width: viewport.width, height: 80 },
                styles: {
                    backgroundColor: '#2563eb',
                    padding: '20px',
                    display: 'flex'
                },
                children: [
                    {
                        id: 'logo',
                        tagName: 'H1',
                        textContent: 'Sample Website',
                        bounds: { x: 20, y: 20, width: 200, height: 40 },
                        styles: {
                            color: '#ffffff',
                            fontSize: 24,
                            fontWeight: 700,
                            fontFamily: 'Inter'
                        },
                        children: []
                    },
                    {
                        id: 'nav',
                        tagName: 'NAV',
                        bounds: { x: viewport.width - 300, y: 20, width: 280, height: 40 },
                        styles: {
                            display: 'flex',
                            gap: '20px'
                        },
                        children: [
                            {
                                id: 'nav-home',
                                tagName: 'A',
                                textContent: 'Home',
                                bounds: { x: viewport.width - 280, y: 25, width: 50, height: 30 },
                                styles: {
                                    color: '#ffffff',
                                    fontSize: 16,
                                    fontWeight: 500
                                },
                                children: []
                            },
                            {
                                id: 'nav-about',
                                tagName: 'A',
                                textContent: 'About',
                                bounds: { x: viewport.width - 220, y: 25, width: 60, height: 30 },
                                styles: {
                                    color: '#ffffff',
                                    fontSize: 16,
                                    fontWeight: 500
                                },
                                children: []
                            },
                            {
                                id: 'nav-contact',
                                tagName: 'A',
                                textContent: 'Contact',
                                bounds: { x: viewport.width - 150, y: 25, width: 70, height: 30 },
                                styles: {
                                    color: '#ffffff',
                                    fontSize: 16,
                                    fontWeight: 500
                                },
                                children: []
                            }
                        ]
                    }
                ]
            },
            // Main content section
            {
                id: 'main-content',
                tagName: 'MAIN',
                bounds: { x: 0, y: 80, width: viewport.width, height: viewport.height - 160 },
                styles: {
                    backgroundColor: '#ffffff',
                    padding: '40px'
                },
                children: [
                    {
                        id: 'hero-section',
                        tagName: 'SECTION',
                        bounds: { x: 40, y: 120, width: viewport.width - 80, height: 200 },
                        styles: {
                            backgroundColor: '#f8fafc',
                            borderRadius: '12px',
                            padding: '40px'
                        },
                        children: [
                            {
                                id: 'hero-title',
                                tagName: 'H1',
                                textContent: 'Welcome to Our Website',
                                bounds: { x: 80, y: 160, width: viewport.width - 160, height: 50 },
                                styles: {
                                    color: '#1e293b',
                                    fontSize: 36,
                                    fontWeight: 700,
                                    textAlign: 'center'
                                },
                                children: []
                            },
                            {
                                id: 'hero-subtitle',
                                tagName: 'P',
                                textContent: 'This is a sample website converted to Figma using our HTML to Figma plugin.',
                                bounds: { x: 80, y: 220, width: viewport.width - 160, height: 60 },
                                styles: {
                                    color: '#64748b',
                                    fontSize: 18,
                                    lineHeight: '1.6',
                                    textAlign: 'center'
                                },
                                children: []
                            }
                        ]
                    },
                    {
                        id: 'content-grid',
                        tagName: 'DIV',
                        bounds: { x: 40, y: 360, width: viewport.width - 80, height: 300 },
                        styles: {
                            display: 'grid',
                            gap: '20px'
                        },
                        children: [
                            {
                                id: 'card-1',
                                tagName: 'DIV',
                                bounds: { x: 40, y: 360, width: (viewport.width - 120) / 3, height: 280 },
                                styles: {
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    padding: '24px'
                                },
                                children: [
                                    {
                                        id: 'card-1-title',
                                        tagName: 'H3',
                                        textContent: 'Feature One',
                                        bounds: { x: 64, y: 384, width: (viewport.width - 168) / 3, height: 30 },
                                        styles: {
                                            color: '#1e293b',
                                            fontSize: 20,
                                            fontWeight: 600
                                        },
                                        children: []
                                    },
                                    {
                                        id: 'card-1-text',
                                        tagName: 'P',
                                        textContent: 'This is the first feature of our website. It demonstrates how text content is preserved.',
                                        bounds: { x: 64, y: 424, width: (viewport.width - 168) / 3, height: 80 },
                                        styles: {
                                            color: '#64748b',
                                            fontSize: 14,
                                            lineHeight: '1.5'
                                        },
                                        children: []
                                    }
                                ]
                            },
                            {
                                id: 'card-2',
                                tagName: 'DIV',
                                bounds: { x: 40 + (viewport.width - 120) / 3 + 20, y: 360, width: (viewport.width - 120) / 3, height: 280 },
                                styles: {
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    padding: '24px'
                                },
                                children: [
                                    {
                                        id: 'card-2-title',
                                        tagName: 'H3',
                                        textContent: 'Feature Two',
                                        bounds: { x: 64 + (viewport.width - 120) / 3 + 20, y: 384, width: (viewport.width - 168) / 3, height: 30 },
                                        styles: {
                                            color: '#1e293b',
                                            fontSize: 20,
                                            fontWeight: 600
                                        },
                                        children: []
                                    },
                                    {
                                        id: 'card-2-text',
                                        tagName: 'P',
                                        textContent: 'The second feature shows how styling and layout are maintained during conversion.',
                                        bounds: { x: 64 + (viewport.width - 120) / 3 + 20, y: 424, width: (viewport.width - 168) / 3, height: 80 },
                                        styles: {
                                            color: '#64748b',
                                            fontSize: 14,
                                            lineHeight: '1.5'
                                        },
                                        children: []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            // Footer section
            {
                id: 'footer',
                tagName: 'FOOTER',
                bounds: { x: 0, y: viewport.height - 80, width: viewport.width, height: 80 },
                styles: {
                    backgroundColor: '#1e293b',
                    padding: '20px'
                },
                children: [
                    {
                        id: 'footer-text',
                        tagName: 'P',
                        textContent: '© 2024 Sample Website. All rights reserved.',
                        bounds: { x: 20, y: viewport.height - 60, width: viewport.width - 40, height: 40 },
                        styles: {
                            color: '#94a3b8',
                            fontSize: 14,
                            textAlign: 'center'
                        },
                        children: []
                    }
                ]
            }
        ],
        assets: {
            images: new Map(),
            backgrounds: new Map(),
            icons: new Map()
        },
        fonts: {
            'Inter': ['Regular', 'Medium', 'Bold']
        }
    };
}

// ===== FIGMA NODE CREATION SYSTEM =====

/**
 * Main class for creating and managing Figma nodes from HTML elements
 * 
 * This class handles the conversion of HTML elements to appropriate Figma node types,
 * applying styles, positioning, and text content while maintaining visual fidelity.
 * 
 * Key Features:
 * - Maps HTML elements to appropriate Figma node types (TEXT, FRAME, RECTANGLE, GROUP)
 * - Applies extracted CSS styles to Figma nodes (colors, fonts, dimensions, effects)
 * - Handles text content extraction and formatting
 * - Manages font loading and fallbacks
 * - Supports common CSS properties like borders, shadows, and border radius
 * 
 * Requirements Addressed:
 * - 1.2: Convert visual elements to corresponding Figma layers
 * - 2.2: Apply equivalent Figma properties from CSS styles  
 * - 5.1: Create native Figma components that support standard operations
 */
class FigmaNodeCreator {
    constructor() {
        this.loadedFonts = new Set();
        this.defaultFont = { family: "Inter", style: "Regular" };
    }

    /**
     * Create appropriate Figma node based on HTML element type and properties
     */
    async createNodeFromElement(element) {
        // Validate element structure
        if (!element || !element.bounds) {
            console.warn('Invalid element structure:', element);
            return null;
        }

        // Ensure styles object exists
        if (!element.styles) {
            element.styles = {};
        }

        const nodeType = this.determineNodeType(element);

        try {
            switch (nodeType) {
                case 'TEXT':
                    return await this.createTextNode(element);
                case 'FRAME':
                    return await this.createFrameNode(element);
                case 'RECTANGLE':
                    return await this.createRectangleNode(element);
                case 'GROUP':
                    return await this.createGroupNode(element);
                default:
                    return await this.createRectangleNode(element); // fallback
            }
        } catch (error) {
            console.error('Error creating node for element:', element, error);
            return null;
        }
    }

    /**
     * Determine the appropriate Figma node type for an HTML element
     */
    determineNodeType(element) {
        // Text elements
        if (element.textContent && element.textContent.trim() &&
            ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LABEL', 'BUTTON'].includes(element.tagName)) {
            return 'TEXT';
        }

        // Container elements that should be frames
        if (['DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'ASIDE'].includes(element.tagName)) {
            return 'FRAME';
        }

        // Elements that need grouping
        if (element.children && element.children.length > 1) {
            return 'GROUP';
        }

        // Default to rectangle for other elements
        return 'RECTANGLE';
    }

    /**
     * Create a text node with proper styling
     */
    async createTextNode(element) {
        const textNode = figma.createText();

        // Load appropriate font
        const fontName = await this.loadFont(element.styles);
        textNode.fontName = fontName;

        // Set text content
        const textContent = this.extractTextContent(element);
        if (textContent) {
            textNode.characters = textContent;
        } else {
            textNode.characters = 'Text'; // Fallback for empty text
        }

        // Apply dimensions and positioning
        this.applyDimensions(textNode, element.bounds);
        this.applyPosition(textNode, element.bounds);

        // Apply text styles
        await this.applyTextStyles(textNode, element.styles);

        // Apply common styles
        this.applyCommonStyles(textNode, element);

        // Set node name
        textNode.name = this.generateNodeName(element);

        return textNode;
    }

    /**
     * Create a frame node for container elements
     */
    async createFrameNode(element) {
        const frame = figma.createFrame();

        // Set frame properties
        frame.name = this.generateNodeName(element);

        // Apply dimensions and positioning
        this.applyDimensions(frame, element.bounds);
        this.applyPosition(frame, element.bounds);

        // Apply frame-specific styles
        await this.applyFrameStyles(frame, element.styles);

        // Apply common styles
        this.applyCommonStyles(frame, element);

        return frame;
    }

    /**
     * Create a rectangle node for visual elements
     */
    async createRectangleNode(element) {
        const rectangle = figma.createRectangle();

        // Set rectangle properties
        rectangle.name = this.generateNodeName(element);

        // Apply dimensions and positioning
        this.applyDimensions(rectangle, element.bounds);
        this.applyPosition(rectangle, element.bounds);

        // Apply rectangle-specific styles
        await this.applyRectangleStyles(rectangle, element.styles);

        // Handle IMG elements specifically
        if (element.tagName === 'IMG') {
            await this.applyImageElement(rectangle, element);
        }

        // Apply common styles
        this.applyCommonStyles(rectangle, element);

        return rectangle;
    }

    /**
     * Create a group node for multiple child elements
     */
    async createGroupNode(element) {
        const group = figma.group([], figma.currentPage);
        group.name = this.generateNodeName(element);

        // Groups will be positioned after children are added
        return group;
    }

    /**
     * Apply text-specific styles to a text node
     */
    async applyTextStyles(textNode, styles) {
        if (styles.fontSize) {
            textNode.fontSize = Math.max(1, Math.round(styles.fontSize));
        }

        if (styles.lineHeight) {
            textNode.lineHeight = this.convertLineHeight(styles.lineHeight, styles.fontSize);
        }

        if (styles.fontWeight) {
            // Font weight is handled in font loading
        }

        if (styles.textAlign) {
            textNode.textAlignHorizontal = this.convertTextAlign(styles.textAlign);
        }

        if (styles.color) {
            textNode.fills = [{
                type: 'SOLID',
                color: this.parseColor(styles.color)
            }];
        }

        // Handle text decorations
        if (styles.textDecoration) {
            this.applyTextDecoration(textNode, styles.textDecoration);
        }

        // Handle letter spacing
        if (styles.letterSpacing && styles.letterSpacing !== 'normal') {
            const spacing = this.parseLetterSpacing(styles.letterSpacing);
            if (spacing !== null) {
                textNode.letterSpacing = spacing;
            }
        }

        // Handle text transform
        if (styles.textTransform) {
            this.applyTextTransform(textNode, styles.textTransform);
        }
    }

    /**
     * Apply text decoration (underline, strikethrough, etc.)
     */
    applyTextDecoration(textNode, textDecoration) {
        if (!textDecoration || textDecoration === 'none') return;

        const decorations = textDecoration.toLowerCase().split(' ');

        if (decorations.includes('underline')) {
            textNode.textDecoration = 'UNDERLINE';
        } else if (decorations.includes('line-through')) {
            textNode.textDecoration = 'STRIKETHROUGH';
        }
    }

    /**
     * Parse letter spacing from CSS
     */
    parseLetterSpacing(letterSpacing) {
        if (!letterSpacing || letterSpacing === 'normal') return null;

        const trimmed = letterSpacing.trim();

        if (trimmed.endsWith('px')) {
            return { unit: 'PIXELS', value: parseFloat(trimmed) };
        }

        if (trimmed.endsWith('em')) {
            return { unit: 'PERCENT', value: parseFloat(trimmed) * 100 };
        }

        // Try to parse as number (pixels)
        const value = parseFloat(trimmed);
        if (!isNaN(value)) {
            return { unit: 'PIXELS', value: value };
        }

        return null;
    }

    /**
     * Apply text transform (uppercase, lowercase, capitalize)
     */
    applyTextTransform(textNode, textTransform) {
        if (!textTransform || textTransform === 'none') return;

        const currentText = textNode.characters;

        switch (textTransform.toLowerCase()) {
            case 'uppercase':
                textNode.characters = currentText.toUpperCase();
                break;
            case 'lowercase':
                textNode.characters = currentText.toLowerCase();
                break;
            case 'capitalize':
                textNode.characters = currentText.replace(/\b\w/g, l => l.toUpperCase());
                break;
        }
    }

    /**
     * Apply frame-specific styles
     */
    async applyFrameStyles(frame, styles) {
        // Background color
        if (styles.backgroundColor && styles.backgroundColor !== 'transparent') {
            frame.fills = [{
                type: 'SOLID',
                color: this.parseColor(styles.backgroundColor)
            }];
        } else {
            frame.fills = []; // Transparent
        }

        // Border radius
        if (styles.borderRadius) {
            const radius = this.parseBorderRadius(styles.borderRadius);
            frame.cornerRadius = radius;
        }

        // Auto layout if applicable
        if (this.shouldUseAutoLayout(styles)) {
            this.applyAutoLayout(frame, styles);
        }
    }

    /**
     * Apply rectangle-specific styles
     */
    async applyRectangleStyles(rectangle, styles) {
        // Background color
        if (styles.backgroundColor && styles.backgroundColor !== 'transparent') {
            rectangle.fills = [{
                type: 'SOLID',
                color: this.parseColor(styles.backgroundColor)
            }];
        }

        // Border radius
        if (styles.borderRadius) {
            const radius = this.parseBorderRadius(styles.borderRadius);
            rectangle.cornerRadius = radius;
        }

        // Background image (if available)
        if (styles.backgroundImage) {
            await this.applyBackgroundImage(rectangle, styles.backgroundImage, styles.backgroundProperties);
        }

        // Background gradient (if available)
        if (styles.backgroundGradient) {
            this.applyBackgroundGradient(rectangle, styles.backgroundGradient);
        }
    }

    /**
     * Apply common styles to any node type
     */
    applyCommonStyles(node, element) {
        // Opacity
        if (element.styles.opacity !== undefined) {
            node.opacity = Math.max(0, Math.min(1, element.styles.opacity));
        }

        // Box shadow (as effects)
        if (element.styles.boxShadow) {
            const effects = this.parseBoxShadow(element.styles.boxShadow);
            if (effects.length > 0) {
                node.effects = effects;
            }
        }

        // Border (as strokes)
        if (element.styles.border) {
            const strokes = this.parseBorder(element.styles.border);
            if (strokes.length > 0) {
                node.strokes = strokes;
            }
        }
    }

    /**
     * Apply dimensions to a node
     */
    applyDimensions(node, bounds) {
        if (bounds.width > 0 && bounds.height > 0) {
            node.resize(Math.max(1, bounds.width), Math.max(1, bounds.height));
        }
    }

    /**
     * Apply position to a node
     */
    applyPosition(node, bounds) {
        node.x = bounds.x;
        node.y = bounds.y;
    }

    /**
     * Load appropriate font for text elements
     */
    async loadFont(styles) {
        let fontFamily = 'Inter';
        let fontStyle = 'Regular';

        // Parse font family
        if (styles.fontFamily) {
            fontFamily = this.parseFontFamily(styles.fontFamily);
        }

        // Parse font weight and style
        if (styles.fontWeight) {
            fontStyle = this.parseFontStyle(styles.fontWeight, styles.fontStyle);
        }

        const fontName = { family: fontFamily, style: fontStyle };
        const fontKey = `${fontFamily}-${fontStyle}`;

        // Load font if not already loaded
        if (!this.loadedFonts.has(fontKey)) {
            try {
                await figma.loadFontAsync(fontName);
                this.loadedFonts.add(fontKey);
            } catch (error) {
                console.warn(`Failed to load font ${fontFamily} ${fontStyle}, using default`);
                await figma.loadFontAsync(this.defaultFont);
                return this.defaultFont;
            }
        }

        return fontName;
    }

    /**
     * Extract clean text content from element
     */
    extractTextContent(element) {
        if (!element || !element.textContent) return '';

        let text = element.textContent;

        // Handle special characters and entities
        text = text
            .replace(/&nbsp;/g, ' ')           // Non-breaking spaces
            .replace(/&amp;/g, '&')           // Ampersands
            .replace(/&lt;/g, '<')            // Less than
            .replace(/&gt;/g, '>')            // Greater than
            .replace(/&quot;/g, '"')          // Quotes
            .replace(/&#39;/g, "'")           // Apostrophes
            .replace(/\u00A0/g, ' ')          // Unicode non-breaking space
            .replace(/\u2013/g, '–')          // En dash
            .replace(/\u2014/g, '—')          // Em dash
            .replace(/\u2018/g, "'")          // Left single quote
            .replace(/\u2019/g, "'")          // Right single quote
            .replace(/\u201C/g, '"')          // Left double quote
            .replace(/\u201D/g, '"')          // Right double quote
            .replace(/\s+/g, ' ')             // Normalize whitespace
            .trim();

        // Return empty string if only whitespace or too short
        return text.length > 0 ? text : '';
    }

    /**
     * Generate meaningful node names based on element properties
     */
    generateNodeName(element) {
        // Priority 1: Use ID if available
        if (element.id && element.id.trim()) {
            return this.cleanNodeName(element.id);
        }

        // Priority 2: Use first class name if available
        if (element.className && element.className.trim()) {
            const firstClass = element.className.split(' ')[0];
            return this.cleanNodeName(firstClass);
        }

        // Priority 3: Use text content for text elements (truncated)
        if (element.textContent && element.textContent.trim()) {
            const text = element.textContent.trim();
            if (text.length > 0) {
                const truncated = text.length > 30 ? text.substring(0, 30) + '...' : text;
                return this.cleanNodeName(truncated);
            }
        }

        // Priority 4: Use semantic names based on tag and context
        const tagName = element.tagName ? element.tagName.toLowerCase() : 'element';

        switch (tagName) {
            case 'header':
                return 'Header';
            case 'footer':
                return 'Footer';
            case 'nav':
                return 'Navigation';
            case 'main':
                return 'Main Content';
            case 'aside':
                return 'Sidebar';
            case 'section':
                return 'Section';
            case 'article':
                return 'Article';
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                return `Heading ${tagName.charAt(1)}`;
            case 'p':
                return 'Paragraph';
            case 'img':
                return 'Image';
            case 'button':
                return 'Button';
            case 'a':
                return 'Link';
            case 'ul':
                return 'List';
            case 'li':
                return 'List Item';
            case 'form':
                return 'Form';
            case 'input':
                return 'Input';
            case 'textarea':
                return 'Text Area';
            case 'select':
                return 'Select';
            case 'div':
                return 'Container';
            case 'span':
                return 'Text';
            default:
                return tagName.charAt(0).toUpperCase() + tagName.slice(1);
        }
    }

    /**
     * Clean node name for Figma compatibility
     */
    cleanNodeName(name) {
        return name
            .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
            .replace(/\s+/g, ' ')              // Normalize spaces
            .trim()                            // Remove leading/trailing spaces
            .substring(0, 50);                 // Limit length
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Parse color string to Figma RGB format
     */
    parseColor(colorStr) {
        if (!colorStr || colorStr === 'transparent') {
            return { r: 0, g: 0, b: 0 };
        }

        // Handle hex colors
        if (colorStr.startsWith('#')) {
            return this.hexToRgb(colorStr);
        }

        // Handle rgb/rgba colors
        if (colorStr.startsWith('rgb')) {
            return this.rgbStringToRgb(colorStr);
        }

        // Handle named colors (basic set)
        const namedColors = {
            'black': { r: 0, g: 0, b: 0 },
            'white': { r: 1, g: 1, b: 1 },
            'red': { r: 1, g: 0, b: 0 },
            'green': { r: 0, g: 1, b: 0 },
            'blue': { r: 0, g: 0, b: 1 },
        };

        return namedColors[colorStr.toLowerCase()] || { r: 0, g: 0, b: 0 };
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * Convert RGB string to RGB object
     */
    rgbStringToRgb(rgbStr) {
        const match = rgbStr.match(/rgba?\(([^)]+)\)/);
        if (!match) return { r: 0, g: 0, b: 0 };

        const values = match[1].split(',').map(v => parseFloat(v.trim()));
        return {
            r: (values[0] || 0) / 255,
            g: (values[1] || 0) / 255,
            b: (values[2] || 0) / 255
        };
    }

    /**
     * Parse font family from CSS font-family string
     */
    parseFontFamily(fontFamilyStr) {
        // Extract first font family, remove quotes
        const families = fontFamilyStr.split(',');
        let family = families[0].trim().replace(/['"]/g, '');

        // Enhanced font mapping for better Figma compatibility
        const fontMap = {
            // Sans-serif fonts
            'Arial': 'Inter',
            'Helvetica': 'Inter',
            'Helvetica Neue': 'Inter',
            'sans-serif': 'Inter',
            'system-ui': 'Inter',
            '-apple-system': 'Inter',
            'BlinkMacSystemFont': 'Inter',
            'Segoe UI': 'Inter',
            'Roboto': 'Roboto',
            'Ubuntu': 'Inter',
            'Cantarell': 'Inter',
            'Fira Sans': 'Inter',
            'Droid Sans': 'Inter',
            'Oxygen': 'Inter',
            'Open Sans': 'Open Sans',
            'Lato': 'Inter',
            'Montserrat': 'Inter',
            'Source Sans Pro': 'Inter',

            // Serif fonts
            'Times': 'Times New Roman',
            'Times New Roman': 'Times New Roman',
            'serif': 'Times New Roman',
            'Georgia': 'Georgia',
            'Garamond': 'Times New Roman',
            'Baskerville': 'Times New Roman',
            'Palatino': 'Times New Roman',

            // Monospace fonts
            'Courier': 'Courier New',
            'Courier New': 'Courier New',
            'monospace': 'Courier New',
            'Monaco': 'Courier New',
            'Menlo': 'Courier New',
            'Consolas': 'Courier New',
            'DejaVu Sans Mono': 'Courier New',
            'Liberation Mono': 'Courier New',
            'Source Code Pro': 'Courier New',
            'Fira Code': 'Courier New',

            // Display fonts
            'Impact': 'Inter',
            'Trebuchet MS': 'Inter',
            'Verdana': 'Inter',
            'Tahoma': 'Inter',
            'Comic Sans MS': 'Inter'
        };

        return fontMap[family] || family || 'Inter';
    }

    /**
     * Parse font style from weight and style
     */
    parseFontStyle(fontWeight, fontStyle) {
        const weight = parseInt(fontWeight) || 400;
        const style = fontStyle || 'normal';

        // Handle italic styles
        if (style === 'italic' || style === 'oblique') {
            if (weight >= 800) return 'Black Italic';
            if (weight >= 700) return 'Bold Italic';
            if (weight >= 600) return 'SemiBold Italic';
            if (weight >= 500) return 'Medium Italic';
            if (weight <= 200) return 'Thin Italic';
            if (weight <= 300) return 'Light Italic';
            return 'Italic';
        }

        // Handle normal styles with different weights
        if (weight >= 900) return 'Black';
        if (weight >= 800) return 'ExtraBold';
        if (weight >= 700) return 'Bold';
        if (weight >= 600) return 'SemiBold';
        if (weight >= 500) return 'Medium';
        if (weight <= 100) return 'Thin';
        if (weight <= 200) return 'ExtraLight';
        if (weight <= 300) return 'Light';

        return 'Regular';
    }

    /**
     * Convert CSS text-align to Figma text align
     */
    convertTextAlign(textAlign) {
        const alignMap = {
            'left': 'LEFT',
            'center': 'CENTER',
            'centre': 'CENTER',
            'right': 'RIGHT',
            'justify': 'JUSTIFIED',
            'start': 'LEFT',
            'end': 'RIGHT'
        };
        return alignMap[textAlign?.toLowerCase()] || 'LEFT';
    }

    /**
     * Convert CSS line-height to Figma line height
     */
    convertLineHeight(lineHeight, fontSize) {
        if (!lineHeight || lineHeight === 'normal') {
            return { unit: 'AUTO' };
        }

        if (typeof lineHeight === 'number') {
            // If it's a number, it's a multiplier
            if (lineHeight < 10) {
                return { unit: 'PIXELS', value: lineHeight * (fontSize || 16) };
            } else {
                // If it's a large number, treat as pixels
                return { unit: 'PIXELS', value: lineHeight };
            }
        }

        if (typeof lineHeight === 'string') {
            const trimmed = lineHeight.trim().toLowerCase();

            if (trimmed.endsWith('px')) {
                return { unit: 'PIXELS', value: parseFloat(trimmed) };
            }

            if (trimmed.endsWith('em')) {
                const emValue = parseFloat(trimmed);
                return { unit: 'PIXELS', value: emValue * (fontSize || 16) };
            }

            if (trimmed.endsWith('rem')) {
                const remValue = parseFloat(trimmed);
                return { unit: 'PIXELS', value: remValue * 16 }; // Assuming 16px root font size
            }

            if (trimmed.endsWith('%')) {
                const percent = parseFloat(trimmed);
                return { unit: 'PERCENT', value: percent };
            }

            // Unitless values are multipliers of font size
            const multiplier = parseFloat(trimmed);
            if (!isNaN(multiplier)) {
                return { unit: 'PIXELS', value: multiplier * (fontSize || 16) };
            }
        }

        return { unit: 'AUTO' };
    }

    /**
     * Parse border radius from CSS
     */
    parseBorderRadius(borderRadius) {
        if (typeof borderRadius === 'number') return borderRadius;
        if (typeof borderRadius === 'string') {
            const value = parseFloat(borderRadius);
            return isNaN(value) ? 0 : value;
        }
        return 0;
    }

    /**
     * Parse box shadow into Figma effects
     */
    parseBoxShadow(boxShadow) {
        // Basic box shadow parsing - can be enhanced
        if (!boxShadow || boxShadow === 'none') return [];

        // Simple shadow format: "2px 2px 4px rgba(0,0,0,0.1)"
        const shadowRegex = /(-?\d+px)\s+(-?\d+px)\s+(\d+px)\s+(rgba?\([^)]+\))/;
        const match = boxShadow.match(shadowRegex);

        if (match) {
            const [, offsetX, offsetY, blurRadius, color] = match;
            return [{
                type: 'DROP_SHADOW',
                color: this.parseColor(color),
                offset: {
                    x: parseFloat(offsetX),
                    y: parseFloat(offsetY)
                },
                radius: parseFloat(blurRadius),
                visible: true
            }];
        }

        return [];
    }

    /**
     * Parse border into Figma strokes
     */
    parseBorder(border) {
        // Basic border parsing
        if (!border || border === 'none') return [];

        // Simple border format: "1px solid #000"
        const borderRegex = /(\d+px)\s+(solid|dashed|dotted)\s+(.+)/;
        const match = border.match(borderRegex);

        if (match) {
            const [, width, style, color] = match;
            return [{
                type: 'SOLID',
                color: this.parseColor(color)
            }];
        }

        return [];
    }

    /**
     * Determine if auto layout should be used
     */
    shouldUseAutoLayout(styles) {
        return styles.display === 'flex' || styles.display === 'grid';
    }

    /**
     * Apply auto layout to frame
     */
    applyAutoLayout(frame, styles) {
        frame.layoutMode = styles.flexDirection === 'column' ? 'VERTICAL' : 'HORIZONTAL';

        if (styles.gap) {
            frame.itemSpacing = parseFloat(styles.gap) || 0;
        }

        if (styles.padding) {
            const padding = parseFloat(styles.padding) || 0;
            frame.paddingTop = padding;
            frame.paddingRight = padding;
            frame.paddingBottom = padding;
            frame.paddingLeft = padding;
        }
    }

    /**
     * Apply background image to node using optimized asset manager with positioning support
     */
    async applyBackgroundImage(node, backgroundImage, backgroundProperties = null) {
        try {
            console.log('Processing background image:', backgroundImage);

            // Use the global asset manager for optimized downloading
            const imageData = await assetManager.downloadImageWithQueue(backgroundImage);

            if (imageData) {
                // Determine scale mode based on background-size property
                let scaleMode = 'FILL'; // Default
                let imageTransform = null;

                if (backgroundProperties && backgroundProperties.size) {
                    const size = backgroundProperties.size.toLowerCase();
                    if (size === 'cover') {
                        scaleMode = 'FILL';
                    } else if (size === 'contain') {
                        scaleMode = 'FIT';
                    } else if (size === 'auto' || size.includes('auto')) {
                        scaleMode = 'CROP';
                    } else {
                        // Custom size - use CROP and calculate transform
                        scaleMode = 'CROP';
                        imageTransform = this.calculateImageTransform(backgroundProperties);
                    }
                }

                // Apply image as fill to the node
                const imageFill = {
                    type: 'IMAGE',
                    imageHash: imageData.hash,
                    scaleMode: scaleMode
                };

                // Apply transform if calculated
                if (imageTransform) {
                    imageFill.imageTransform = imageTransform;
                }

                // Replace existing fills or add to them
                node.fills = [imageFill];
                performanceMonitor.imageProcessed();

                console.log('Successfully applied background image to node with properties:', backgroundProperties);
            }
        } catch (error) {
            console.warn('Failed to apply background image:', error.message);
            // Continue without the image - don't break the conversion
        }
    }

    /**
     * Calculate image transform matrix for custom background positioning
     */
    calculateImageTransform(backgroundProperties) {
        try {
            // Parse background position (e.g., "center center", "50% 50%", "10px 20px")
            const position = backgroundProperties.position || '0% 0%';
            const parts = position.split(/\s+/);

            let x = 0, y = 0;

            // Parse X position
            if (parts[0]) {
                if (parts[0].includes('%')) {
                    x = parseFloat(parts[0]) / 100;
                } else if (parts[0] === 'center') {
                    x = 0.5;
                } else if (parts[0] === 'left') {
                    x = 0;
                } else if (parts[0] === 'right') {
                    x = 1;
                } else {
                    // Pixel values - approximate as percentage
                    x = 0;
                }
            }

            // Parse Y position
            if (parts[1]) {
                if (parts[1].includes('%')) {
                    y = parseFloat(parts[1]) / 100;
                } else if (parts[1] === 'center') {
                    y = 0.5;
                } else if (parts[1] === 'top') {
                    y = 0;
                } else if (parts[1] === 'bottom') {
                    y = 1;
                } else {
                    // Pixel values - approximate as percentage
                    y = 0;
                }
            }

            // Return transform matrix for positioning
            // Figma uses a 2x3 transformation matrix [[a, b, c], [d, e, f]]
            // For simple translation: [[1, 0, tx], [0, 1, ty]]
            return [
                [1, 0, x - 0.5], // Translate X (centered around 0.5)
                [0, 1, y - 0.5]  // Translate Y (centered around 0.5)
            ];
        } catch (error) {
            console.warn('Failed to calculate image transform:', error);
            return null;
        }
    }

    /**
     * Apply background gradient to node as gradient fill
     */
    applyBackgroundGradient(node, gradientString) {
        try {
            console.log('Processing background gradient:', gradientString);

            const gradient = this.parseGradient(gradientString);
            if (gradient) {
                // Create gradient fill
                const gradientFill = {
                    type: 'GRADIENT_LINEAR', // Default to linear
                    gradientTransform: gradient.transform,
                    gradientStops: gradient.stops
                };

                // Set gradient type based on parsed gradient
                if (gradient.type === 'radial') {
                    gradientFill.type = 'GRADIENT_RADIAL';
                } else if (gradient.type === 'conic') {
                    gradientFill.type = 'GRADIENT_ANGULAR';
                }

                // Add gradient fill to node (preserve existing fills if any)
                const existingFills = node.fills || [];
                node.fills = [...existingFills, gradientFill];

                console.log('Successfully applied gradient fill to node');
            }
        } catch (error) {
            console.warn('Failed to apply background gradient:', error.message);
            // Continue without the gradient - don't break the conversion
        }
    }

    /**
     * Parse CSS gradient string into Figma gradient format
     */
    parseGradient(gradientString) {
        try {
            // Remove extra whitespace and normalize
            const gradient = gradientString.trim();

            // Determine gradient type
            let type = 'linear';
            if (gradient.startsWith('radial-gradient')) {
                type = 'radial';
            } else if (gradient.startsWith('conic-gradient')) {
                type = 'conic';
            }

            // Extract gradient content (everything inside parentheses)
            const match = gradient.match(/\(([^)]+)\)/);
            if (!match) return null;

            const content = match[1];

            // Parse gradient stops and direction
            const parts = content.split(',').map(part => part.trim());

            let direction = '0deg'; // Default direction
            let colorStops = [];

            // Check if first part is direction/angle
            const firstPart = parts[0];
            if (firstPart.includes('deg') || firstPart.includes('turn') ||
                ['to top', 'to bottom', 'to left', 'to right'].some(dir => firstPart.includes(dir))) {
                direction = firstPart;
                colorStops = parts.slice(1);
            } else {
                colorStops = parts;
            }

            // Parse color stops
            const gradientStops = [];
            colorStops.forEach((stop, index) => {
                const colorStop = this.parseColorStop(stop, index, colorStops.length);
                if (colorStop) {
                    gradientStops.push(colorStop);
                }
            });

            // Calculate transform matrix based on direction
            const transform = this.calculateGradientTransform(direction, type);

            return {
                type: type,
                stops: gradientStops,
                transform: transform
            };

        } catch (error) {
            console.warn('Failed to parse gradient:', error);
            return null;
        }
    }

    /**
     * Parse individual color stop from gradient
     */
    parseColorStop(stopString, index, totalStops) {
        try {
            // Extract color and position
            // Examples: "red", "red 50%", "#ff0000 25%", "rgba(255,0,0,0.5) 75%"

            let color = null;
            let position = index / Math.max(1, totalStops - 1); // Default even distribution

            // Handle complex color strings like "rgba(255,0,0,0.5) 25%"
            const trimmed = stopString.trim();

            // Check if there's a percentage at the end
            const percentMatch = trimmed.match(/(.+?)\s+(\d+(?:\.\d+)?)%$/);
            if (percentMatch) {
                color = this.parseColor(percentMatch[1]);
                position = parseFloat(percentMatch[2]) / 100;
            } else {
                // No percentage, just parse the color
                color = this.parseColor(trimmed);
            }

            if (color) {
                return {
                    color: color,
                    position: Math.max(0, Math.min(1, position))
                };
            }

            return null;
        } catch (error) {
            console.warn('Failed to parse color stop:', error);
            return null;
        }
    }

    /**
     * Calculate gradient transform matrix based on direction
     */
    calculateGradientTransform(direction, type) {
        try {
            if (type === 'radial') {
                // Radial gradients use identity transform by default
                return [[1, 0, 0], [0, 1, 0]];
            }

            // Parse linear gradient direction
            let angle = 0; // Default to 0 degrees (top to bottom)

            if (direction.includes('deg')) {
                angle = parseFloat(direction);
            } else if (direction.includes('turn')) {
                angle = parseFloat(direction) * 360;
            } else {
                // Named directions
                const directionMap = {
                    'to top': 0,
                    'to right': 90,
                    'to bottom': 180,
                    'to left': 270,
                    'to top right': 45,
                    'to bottom right': 135,
                    'to bottom left': 225,
                    'to top left': 315
                };
                angle = directionMap[direction] || 180; // Default to bottom
            }

            // Convert angle to radians and calculate transform
            const radians = (angle * Math.PI) / 180;
            const cos = Math.cos(radians);
            const sin = Math.sin(radians);

            // Figma gradient transform matrix
            return [
                [cos, -sin, 0.5],
                [sin, cos, 0.5]
            ];

        } catch (error) {
            console.warn('Failed to calculate gradient transform:', error);
            // Return identity transform as fallback
            return [[1, 0, 0], [0, 1, 0]];
        }
    }

    /**
     * Parse CSS color string into Figma color format
     */
    parseColor(colorString) {
        try {
            // Handle different color formats
            const color = colorString.trim().toLowerCase();

            // RGB/RGBA format
            if (color.startsWith('rgb')) {
                return this.parseRgbColor(color);
            }

            // Hex format
            if (color.startsWith('#')) {
                return this.parseHexColor(color);
            }

            // HSL format
            if (color.startsWith('hsl')) {
                return this.parseHslColor(color);
            }

            // Named colors
            const namedColor = this.parseNamedColor(color);
            if (namedColor) {
                return namedColor;
            }

            // Fallback to black
            return { r: 0, g: 0, b: 0, a: 1 };

        } catch (error) {
            console.warn('Failed to parse color:', error);
            return { r: 0, g: 0, b: 0, a: 1 };
        }
    }

    /**
     * Parse RGB/RGBA color
     */
    parseRgbColor(rgbString) {
        const match = rgbString.match(/rgba?\(([^)]+)\)/);
        if (!match) return null;

        const values = match[1].split(',').map(v => v.trim());
        const r = parseInt(values[0]) / 255;
        const g = parseInt(values[1]) / 255;
        const b = parseInt(values[2]) / 255;
        const a = values[3] ? parseFloat(values[3]) : 1;

        return { r, g, b, a };
    }

    /**
     * Parse hex color
     */
    parseHexColor(hexString) {
        let hex = hexString.replace('#', '');

        // Convert 3-digit hex to 6-digit
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }

        if (hex.length !== 6) return null;

        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        return { r, g, b, a: 1 };
    }

    /**
     * Parse HSL color (basic implementation)
     */
    parseHslColor(hslString) {
        const match = hslString.match(/hsla?\(([^)]+)\)/);
        if (!match) return null;

        const values = match[1].split(',').map(v => v.trim());
        const h = parseInt(values[0]) / 360;
        const s = parseInt(values[1]) / 100;
        const l = parseInt(values[2]) / 100;
        const a = values[3] ? parseFloat(values[3]) : 1;

        // Convert HSL to RGB (simplified)
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;

        let r, g, b;
        if (h < 1 / 6) { r = c; g = x; b = 0; }
        else if (h < 2 / 6) { r = x; g = c; b = 0; }
        else if (h < 3 / 6) { r = 0; g = c; b = x; }
        else if (h < 4 / 6) { r = 0; g = x; b = c; }
        else if (h < 5 / 6) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        return {
            r: r + m,
            g: g + m,
            b: b + m,
            a: a
        };
    }

    /**
     * Parse named colors (basic set)
     */
    parseNamedColor(colorName) {
        const namedColors = {
            'transparent': { r: 0, g: 0, b: 0, a: 0 },
            'black': { r: 0, g: 0, b: 0, a: 1 },
            'white': { r: 1, g: 1, b: 1, a: 1 },
            'red': { r: 1, g: 0, b: 0, a: 1 },
            'green': { r: 0, g: 0.5, b: 0, a: 1 },
            'blue': { r: 0, g: 0, b: 1, a: 1 },
            'yellow': { r: 1, g: 1, b: 0, a: 1 },
            'cyan': { r: 0, g: 1, b: 1, a: 1 },
            'magenta': { r: 1, g: 0, b: 1, a: 1 },
            'gray': { r: 0.5, g: 0.5, b: 0.5, a: 1 },
            'grey': { r: 0.5, g: 0.5, b: 0.5, a: 1 }
        };

        return namedColors[colorName] || null;
    }

    /**
     * Process IMG elements and apply images as fills using optimized asset manager
     */
    async applyImageElement(node, element) {
        try {
            // For IMG elements, we want to apply the src as the fill
            if (element.tagName === 'IMG' && element.src) {
                console.log('Processing IMG element:', element.src);

                // Use the global asset manager for optimized downloading
                const imageData = await assetManager.downloadImageWithQueue(element.src);

                if (imageData) {
                    const imageFill = {
                        type: 'IMAGE',
                        imageHash: imageData.hash,
                        scaleMode: 'FIT' // For IMG elements, use FIT to maintain aspect ratio
                    };

                    node.fills = [imageFill];
                    performanceMonitor.imageProcessed();
                    console.log('Successfully applied image to IMG element');
                } else {
                    // Add placeholder for failed images
                    this.addImagePlaceholder(node, element.src);
                }
            }
        } catch (error) {
            console.warn('Failed to apply image to IMG element:', error.message);
            this.addImagePlaceholder(node, element.src);
        }
    }

    /**
     * Add placeholder for failed images
     */
    addImagePlaceholder(node, imageUrl) {
        // Add a placeholder fill for failed images
        node.fills = [{
            type: 'SOLID',
            color: { r: 0.95, g: 0.95, b: 0.95 } // Light gray placeholder
        }];

        // Add a text overlay indicating the failed image
        try {
            const textNode = figma.createText();
            textNode.fontName = { family: "Inter", style: "Regular" };
            textNode.characters = "Image failed to load";
            textNode.fontSize = 12;
            textNode.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
            textNode.textAlignHorizontal = 'CENTER';
            textNode.textAlignVertical = 'CENTER';

            // Position text in center of image placeholder
            textNode.x = node.x + (node.width - 120) / 2;
            textNode.y = node.y + (node.height - 16) / 2;
            textNode.resize(120, 16);

            // Add to same parent as the image node
            if (node.parent) {
                node.parent.appendChild(textNode);
            }
        } catch (textError) {
            console.warn('Failed to create placeholder text:', textError);
        }
    }
}

/**
 * Performance-optimized asset manager for parallel image processing
 */
class AssetManager {
    constructor() {
        this.imageCache = new Map();
        this.downloadQueue = [];
        this.activeDownloads = 0;
        this.maxConcurrentDownloads = CONFIG.IMAGE_PROCESSING.MAX_CONCURRENT_DOWNLOADS;
        this.downloadStats = {
            total: 0,
            completed: 0,
            failed: 0,
            cached: 0
        };
    }

    /**
     * Process multiple images in parallel with batching
     */
    async processImagesInParallel(imageUrls, progressCallback) {
        if (!imageUrls || imageUrls.length === 0) return new Map();

        console.log(`Starting parallel processing of ${imageUrls.length} images`);
        this.downloadStats = { total: imageUrls.length, completed: 0, failed: 0, cached: 0 };

        const results = new Map();
        const batchSize = CONFIG.IMAGE_PROCESSING.BATCH_SIZE;

        // Process images in batches to prevent overwhelming the system
        for (let i = 0; i < imageUrls.length; i += batchSize) {
            const batch = imageUrls.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(imageUrls.length / batchSize);

            if (progressCallback) {
                progressCallback(`Processing image batch ${batchNumber}/${totalBatches}...`);
            }

            // Process batch in parallel
            const batchPromises = batch.map(url => this.downloadImageWithQueue(url));
            const batchResults = await Promise.allSettled(batchPromises);

            // Collect results
            batchResults.forEach((result, index) => {
                const url = batch[index];
                if (result.status === 'fulfilled' && result.value) {
                    results.set(url, result.value);
                    this.downloadStats.completed++;
                } else {
                    console.warn(`Failed to download image: ${url}`, result.reason);
                    this.downloadStats.failed++;
                }
            });

            // Update progress
            if (progressCallback) {
                const progress = ((i + batch.length) / imageUrls.length) * 100;
                progressCallback(`Processed ${this.downloadStats.completed}/${imageUrls.length} images`, progress);
            }

            // Small delay between batches to prevent UI blocking
            if (i + batchSize < imageUrls.length) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        console.log(`Image processing complete:`, this.downloadStats);
        return results;
    }

    /**
     * Download image with queue management
     */
    async downloadImageWithQueue(imageUrl) {
        // Check cache first
        if (this.imageCache.has(imageUrl)) {
            this.downloadStats.cached++;
            return this.imageCache.get(imageUrl);
        }

        // Wait for available slot
        while (this.activeDownloads >= this.maxConcurrentDownloads) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.activeDownloads++;

        try {
            const imageData = await this.downloadAndConvertImage(imageUrl);

            if (imageData) {
                // Cache successful downloads
                this.cacheImage(imageUrl, imageData);
            }

            return imageData;
        } finally {
            this.activeDownloads--;
        }
    }

    /**
     * Enhanced image download with better error handling and timeouts
     */
    async downloadAndConvertImage(imageUrl) {
        try {
            // Validate image URL
            if (!imageUrl || typeof imageUrl !== 'string') {
                throw new Error('Invalid image URL');
            }

            // Make sure URL is absolute
            let fullUrl = imageUrl;
            if (imageUrl.startsWith('//')) {
                fullUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
                console.warn('Relative image URL detected, skipping:', imageUrl);
                return null;
            }

            // Skip data URLs for now
            if (imageUrl.startsWith('data:')) {
                console.warn('Data URL images not yet supported, skipping:', imageUrl.substring(0, 50) + '...');
                return null;
            }

            // Create abort controller with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.IMAGE_PROCESSING.TIMEOUT);

            // Fetch with enhanced headers
            const response = await fetch(fullUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*,*/*;q=0.8',
                    'Cache-Control': 'no-cache'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Validate content type
            const contentType = response.headers.get('content-type');
            if (contentType && !CONFIG.IMAGE_PROCESSING.SUPPORTED_FORMATS.some(format =>
                contentType.includes(format.split('/')[1]))) {
                throw new Error(`Unsupported image format: ${contentType}`);
            }

            // Check content length
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > CONFIG.IMAGE_PROCESSING.MAX_IMAGE_SIZE) {
                throw new Error(`Image too large: ${contentLength} bytes`);
            }

            // Get image data
            const arrayBuffer = await response.arrayBuffer();

            if (arrayBuffer.byteLength > CONFIG.IMAGE_PROCESSING.MAX_IMAGE_SIZE) {
                throw new Error(`Image too large: ${arrayBuffer.byteLength} bytes`);
            }

            const uint8Array = new Uint8Array(arrayBuffer);
            const image = figma.createImage(uint8Array);

            return {
                hash: image.hash,
                bytes: uint8Array,
                url: fullUrl,
                size: arrayBuffer.byteLength,
                contentType: contentType
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Image download timeout');
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error downloading image');
            } else {
                throw error;
            }
        }
    }

    /**
     * Cache image with size management
     */
    cacheImage(imageUrl, imageData) {
        // Limit cache size to prevent memory issues
        if (this.imageCache.size >= 100) {
            // Remove oldest entries (simple LRU)
            const keysToRemove = Array.from(this.imageCache.keys()).slice(0, 20);
            keysToRemove.forEach(key => this.imageCache.delete(key));
        }

        this.imageCache.set(imageUrl, imageData);
    }

    /**
     * Get download statistics
     */
    getStats() {
        return { ...this.downloadStats };
    }

    /**
     * Clear cache and reset stats
     */
    reset() {
        this.imageCache.clear();
        this.downloadStats = { total: 0, completed: 0, failed: 0, cached: 0 };
        this.activeDownloads = 0;
    }
}

/**
 * Performance monitor for tracking conversion metrics
 */
class PerformanceMonitor {
    constructor() {
        this.startTime = null;
        this.metrics = {
            totalElements: 0,
            processedElements: 0,
            createdNodes: 0,
            failedElements: 0,
            imagesProcessed: 0,
            batchesProcessed: 0,
            memoryUsage: []
        };
    }

    start(totalElements) {
        this.startTime = Date.now();
        this.metrics.totalElements = totalElements;
        console.log(`Performance monitoring started for ${totalElements} elements`);
    }

    updateProgress(processedElements, createdNodes = 0, failedElements = 0) {
        this.metrics.processedElements = processedElements;
        this.metrics.createdNodes += createdNodes;
        this.metrics.failedElements += failedElements;

        // Track memory usage periodically
        if (processedElements % 20 === 0) {
            this.trackMemoryUsage();
        }
    }

    trackMemoryUsage() {
        // Basic memory tracking (if available)
        if (performance && performance.memory) {
            this.metrics.memoryUsage.push({
                timestamp: Date.now() - this.startTime,
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize
            });
        }
    }

    batchCompleted() {
        this.metrics.batchesProcessed++;
    }

    imageProcessed() {
        this.metrics.imagesProcessed++;
    }

    getReport() {
        const duration = this.startTime ? Date.now() - this.startTime : 0;
        const elementsPerSecond = duration > 0 ? (this.metrics.processedElements / (duration / 1000)).toFixed(2) : 0;

        return {
            duration: duration,
            elementsPerSecond: elementsPerSecond,
            successRate: this.metrics.totalElements > 0 ?
                ((this.metrics.processedElements - this.metrics.failedElements) / this.metrics.totalElements * 100).toFixed(1) : 0,
            ...this.metrics
        };
    }
}

// Create global instances
const nodeCreator = new FigmaNodeCreator();
const assetManager = new AssetManager();
const performanceMonitor = new PerformanceMonitor();

/**
 * Process scraped website data and create Figma nodes with performance optimizations
 */
async function createFigmaNodesFromWebsiteData(websiteData) {
    const conversionStartTime = Date.now();

    try {
        // Initialize performance monitoring
        performanceMonitor.start(websiteData.elements.length);

        // Create main container frame
        const mainFrame = figma.createFrame();
        mainFrame.name = `Website: ${websiteData.title || websiteData.url}`;
        mainFrame.resize(websiteData.viewport.width, websiteData.viewport.height);
        mainFrame.x = 0;
        mainFrame.y = 0;

        // Set background color
        mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

        // Pre-process and collect all image URLs for parallel downloading
        const imageUrls = new Set();
        websiteData.elements.forEach(element => {
            if (element.tagName === 'IMG' && element.src) {
                imageUrls.add(element.src);
            }
            if (element.styles && element.styles.backgroundImage) {
                imageUrls.add(element.styles.backgroundImage);
            }
        });

        // Start parallel image processing if there are images
        let imageProcessingPromise = null;
        if (imageUrls.size > 0) {
            console.log(`Starting parallel processing of ${imageUrls.size} unique images`);
            imageProcessingPromise = assetManager.processImagesInParallel(
                Array.from(imageUrls),
                (message, progress) => {
                    figma.ui.postMessage({
                        type: 'progress',
                        message: `Images: ${message}`,
                        progress: Math.round(50 + (progress || 0) * 0.15) // 50-65% for image processing
                    });
                }
            );
        }

        // Process elements in optimized batches
        const createdNodes = [];
        const totalElements = websiteData.elements.length;
        const BATCH_SIZE = CONFIG.PERFORMANCE.NODE_BATCH_SIZE;
        let processedElements = 0;
        let failedElements = 0;

        // Set processing timeout
        const processingTimeout = setTimeout(() => {
            throw new Error('Processing timeout: Conversion took too long to complete');
        }, CONFIG.PERFORMANCE.MAX_PROCESSING_TIME);

        try {
            for (let batchStart = 0; batchStart < totalElements; batchStart += BATCH_SIZE) {
                const batchEnd = Math.min(batchStart + BATCH_SIZE, totalElements);
                const batch = websiteData.elements.slice(batchStart, batchEnd);
                const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1;
                const totalBatches = Math.ceil(totalElements / BATCH_SIZE);

                // Update progress for batch
                const baseProgress = 65 + (batchStart / totalElements) * 20; // 65-85% for node creation
                figma.ui.postMessage({
                    type: 'progress',
                    message: `Creating nodes: batch ${batchNumber}/${totalBatches} (${batchEnd}/${totalElements} elements)`,
                    progress: Math.round(baseProgress)
                });

                // Process batch elements with error isolation
                const batchResults = await Promise.allSettled(
                    batch.map(async (element, index) => {
                        try {
                            const node = await processElementRecursively(element, mainFrame);
                            if (node) {
                                performanceMonitor.updateProgress(processedElements + index + 1, 1, 0);
                                return node;
                            }
                            return null;
                        } catch (error) {
                            console.warn(`Failed to process element ${batchStart + index}:`, error);
                            performanceMonitor.updateProgress(processedElements + index + 1, 0, 1);
                            failedElements++;
                            return null;
                        }
                    })
                );

                // Collect successful nodes
                batchResults.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        createdNodes.push(result.value);
                    }
                });

                processedElements += batch.length;
                performanceMonitor.batchCompleted();

                // Memory cleanup every N batches
                if (batchNumber % CONFIG.PERFORMANCE.MEMORY_CLEANUP_INTERVAL === 0) {
                    // Force garbage collection hint (if available)
                    if (global && global.gc) {
                        global.gc();
                    }
                    console.log(`Memory cleanup after batch ${batchNumber}`);
                }

                // Adaptive delay between batches based on performance
                const batchProcessingTime = Date.now() - conversionStartTime;
                const avgTimePerBatch = batchProcessingTime / batchNumber;
                const adaptiveDelay = avgTimePerBatch > 1000 ? CONFIG.PERFORMANCE.BATCH_DELAY * 2 : CONFIG.PERFORMANCE.BATCH_DELAY;

                if (batchEnd < totalElements) {
                    await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
                }
            }

            clearTimeout(processingTimeout);

        } catch (error) {
            clearTimeout(processingTimeout);
            throw error;
        }

        // Wait for image processing to complete
        let processedImages = 0;
        if (imageProcessingPromise) {
            figma.ui.postMessage({
                type: 'progress',
                message: 'Finalizing image processing...',
                progress: 85
            });

            try {
                const imageResults = await imageProcessingPromise;
                processedImages = imageResults.size;
                console.log(`Image processing completed: ${processedImages} images processed`);
            } catch (error) {
                console.warn('Some images failed to process:', error);
            }
        }

        // Final organization and cleanup
        figma.ui.postMessage({
            type: 'progress',
            message: 'Organizing layers and finalizing...',
            progress: 90
        });

        // Add main frame to page
        figma.currentPage.appendChild(mainFrame);
        figma.currentPage.selection = [mainFrame];
        figma.viewport.scrollAndZoomIntoView([mainFrame]);

        // Generate performance report
        const performanceReport = performanceMonitor.getReport();
        const conversionTime = ((Date.now() - conversionStartTime) / 1000).toFixed(2);

        console.log('Conversion Performance Report:', performanceReport);

        // Reset managers for next conversion
        assetManager.reset();

        return {
            mainFrame,
            createdNodes,
            totalElements: createdNodes.length,
            imagesProcessed: processedImages,
            failedElements: failedElements,
            conversionTime: conversionTime,
            performanceReport: performanceReport
        };

    } catch (error) {
        console.error('Error creating Figma nodes:', error);

        // Reset managers on error
        assetManager.reset();

        // Enhance error message with performance context
        if (error.message.includes('timeout')) {
            throw new Error(`Conversion timeout: The website was too complex to process within the time limit. Try a simpler page or smaller viewport.`);
        }

        throw error;
    }
}

/**
 * Recursively process elements and their children with proper layer organization
 */
async function processElementRecursively(element, parentNode, depth = 0) {
    try {
        // Skip elements that are too small or invisible
        if (element.bounds && (element.bounds.width < 1 || element.bounds.height < 1)) {
            return null;
        }

        // Create node for current element
        const node = await nodeCreator.createNodeFromElement(element);

        if (!node) return null;

        // Apply z-index ordering if available
        if (element.zIndex && typeof element.zIndex === 'number') {
            // Store z-index for later sorting
            node.setPluginData('zIndex', element.zIndex.toString());
        }

        // Add semantic grouping for better organization
        const shouldGroup = shouldCreateGroup(element, depth);
        let containerNode = node;

        if (shouldGroup && element.children && element.children.length > 1) {
            // Create a group for better organization
            const group = figma.group([node], parentNode);
            group.name = `${node.name} Group`;
            containerNode = group;
        } else {
            // Add to parent
            parentNode.appendChild(node);
        }

        // Process children if they exist
        if (element.children && element.children.length > 0) {
            const childNodes = [];

            // Sort children by z-index if available
            const sortedChildren = [...element.children].sort((a, b) => {
                const aZ = a.zIndex || 0;
                const bZ = b.zIndex || 0;
                return aZ - bZ;
            });

            for (const child of sortedChildren) {
                const childNode = await processElementRecursively(child, containerNode, depth + 1);
                if (childNode) {
                    childNodes.push(childNode);
                }
            }

            // Apply final z-index ordering to children
            organizeLayerOrder(childNodes, containerNode);
        }

        return containerNode;

    } catch (error) {
        console.error('Error processing element:', element, error);
        return null;
    }
}

/**
 * Determine if an element should be grouped with its children
 */
function shouldCreateGroup(element, depth) {
    // Don't create groups for top-level elements
    if (depth === 0) return false;

    // Group container elements with multiple children
    const containerTags = ['div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside'];
    if (containerTags.includes(element.tagName?.toLowerCase())) {
        return element.children && element.children.length > 2;
    }

    return false;
}

/**
 * Organize layer order based on z-index and DOM order
 */
function organizeLayerOrder(nodes, parentNode) {
    if (!nodes || nodes.length <= 1) return;

    // Sort nodes by z-index (stored in plugin data)
    const sortedNodes = nodes.sort((a, b) => {
        const aZ = parseInt(a.getPluginData('zIndex')) || 0;
        const bZ = parseInt(b.getPluginData('zIndex')) || 0;
        return aZ - bZ;
    });

    // Reorder nodes in Figma (higher z-index should be on top)
    sortedNodes.forEach((node, index) => {
        if (node.parent === parentNode) {
            // Move to correct position (Figma layers are bottom-to-top)
            const targetIndex = sortedNodes.length - 1 - index;
            parentNode.insertChild(targetIndex, node);
        }
    });
}

/**
 * Organize elements into logical sections for better layer structure
 */
function organizeElementsIntoSections(elements) {
    const sections = {
        header: { name: 'Header', elements: [] },
        nav: { name: 'Navigation', elements: [] },
        main: { name: 'Main Content', elements: [] },
        aside: { name: 'Sidebar', elements: [] },
        footer: { name: 'Footer', elements: [] }
    };

    elements.forEach(element => {
        const tagName = element.tagName?.toLowerCase();

        switch (tagName) {
            case 'header':
                sections.header.elements.push(element);
                break;
            case 'nav':
                sections.nav.elements.push(element);
                break;
            case 'footer':
                sections.footer.elements.push(element);
                break;
            case 'aside':
                sections.aside.elements.push(element);
                break;
            default:
                sections.main.elements.push(element);
        }
    });

    // Return only sections that have elements
    return Object.values(sections).filter(section => section.elements.length > 0);
}

/**
 * Calculate bounding box for a group of elements
 */
function calculateSectionBounds(elements) {
    if (!elements || elements.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach(element => {
        if (element.bounds) {
            minX = Math.min(minX, element.bounds.x);
            minY = Math.min(minY, element.bounds.y);
            maxX = Math.max(maxX, element.bounds.x + element.bounds.width);
            maxY = Math.max(maxY, element.bounds.y + element.bounds.height);
        }
    });

    if (minX === Infinity) return null;

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Memory management utilities for large conversions
 */
class MemoryManager {
    static cleanup() {
        // Clear any temporary caches
        if (assetManager) {
            assetManager.reset();
        }

        // Clear node creator caches
        if (nodeCreator && nodeCreator.imageCache) {
            nodeCreator.imageCache.clear();
        }

        // Force garbage collection if available
        if (global && global.gc) {
            global.gc();
        }

        console.log('Memory cleanup completed');
    }

    static getMemoryUsage() {
        if (performance && performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    static shouldCleanup(batchNumber) {
        const usage = this.getMemoryUsage();
        if (usage) {
            const usagePercent = (usage.used / usage.limit) * 100;
            return usagePercent > 70 || batchNumber % CONFIG.PERFORMANCE.MEMORY_CLEANUP_INTERVAL === 0;
        }
        return batchNumber % CONFIG.PERFORMANCE.MEMORY_CLEANUP_INTERVAL === 0;
    }
}

/**
 * Timeout manager for handling long-running operations
 */
class TimeoutManager {
    constructor(maxTime = CONFIG.PERFORMANCE.MAX_PROCESSING_TIME) {
        this.maxTime = maxTime;
        this.startTime = Date.now();
        this.timeoutId = null;
    }

    start(onTimeout) {
        this.timeoutId = setTimeout(() => {
            if (onTimeout) {
                onTimeout();
            }
        }, this.maxTime);
    }

    clear() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    getElapsed() {
        return Date.now() - this.startTime;
    }

    getRemainingTime() {
        return Math.max(0, this.maxTime - this.getElapsed());
    }

    isExpired() {
        return this.getElapsed() >= this.maxTime;
    }
}

// Legacy utility functions (kept for backward compatibility)
function hexToRgb(hex) {
    return nodeCreator.hexToRgb(hex);
}

async function createTextNode(text, styles = {}) {
    const element = {
        textContent: text,
        styles: styles,
        tagName: 'SPAN',
        bounds: { x: 0, y: 0, width: 100, height: 20 }
    };
    return await nodeCreator.createTextNode(element);
}

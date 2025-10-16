import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: ['https://www.figma.com', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'HTML to Figma Backend'
    });
});

// Main scraping endpoint with enhanced timeout handling
app.post('/scrape', async (req, res) => {
    const { url, viewport = { width: 1200, height: 800 }, timeout = 60000 } = req.body;
    const startTime = Date.now();

    console.log(`Scraping request for: ${url} (timeout: ${timeout}ms)`);

    // Validate URL
    if (!url || !isValidUrl(url)) {
        return res.status(400).json({
            error: 'Invalid URL provided',
            message: 'Please provide a valid HTTP or HTTPS URL'
        });
    }

    let browser;

    try {
        // Launch browser with Render-optimized configuration
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--single-process',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images', // Disable image loading for faster scraping
                '--disable-javascript' // Disable JS for faster scraping (can be enabled if needed)
            ],
            timeout: Math.min(timeout, 120000),
            protocolTimeout: Math.min(timeout, 120000)
        });

        const page = await browser.newPage();

        // Set viewport
        await page.setViewport({
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1
        });

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Block unnecessary resources for faster loading
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            // Block images, fonts, and other heavy resources during scraping
            if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navigate to URL with adaptive timeout
        console.log('Navigating to URL...');
        const navigationTimeout = Math.min(timeout * 0.6, 45000); // Use 60% of total timeout for navigation

        await page.goto(url, {
            waitUntil: 'domcontentloaded', // Faster than networkidle2
            timeout: navigationTimeout
        });

        // Wait for dynamic content with shorter timeout
        const contentWaitTime = Math.min(3000, timeout * 0.1);
        await page.waitForTimeout(contentWaitTime);

        console.log('Extracting page data...');

        // Extract page data with performance optimizations
        const pageData = await page.evaluate(() => {
            const elements = [];
            const assets = {
                images: [],
                fonts: []
            };

            // Get page title
            const title = document.title || 'Untitled Page';

            // Get all visible elements with performance optimization
            const allElements = document.querySelectorAll('body *');
            const maxElements = 1000; // Limit elements to prevent memory issues
            let processedCount = 0;

            for (let i = 0; i < allElements.length && processedCount < maxElements; i++) {
                const element = allElements[i];
                const rect = element.getBoundingClientRect();
                const styles = window.getComputedStyle(element);

                // Skip elements that are not visible or too small
                if (rect.width < 1 || rect.height < 1 || styles.display === 'none' || styles.visibility === 'hidden') {
                    continue;
                }

                // Skip elements that are outside viewport (with some margin)
                if (rect.bottom < -100 || rect.top > window.innerHeight + 100 ||
                    rect.right < -100 || rect.left > window.innerWidth + 100) {
                    continue;
                }

                // Extract text content (only direct text, not from children)
                let textContent = '';
                for (let node of element.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        textContent += node.textContent.trim();
                    }
                }

                // Get background image and gradient information
                let backgroundImage = null;
                let backgroundGradient = null;
                let backgroundProperties = null;

                const bgImage = styles.backgroundImage;
                if (bgImage && bgImage !== 'none') {
                    // Check for gradient first
                    if (bgImage.includes('gradient')) {
                        backgroundGradient = bgImage;
                    } else {
                        // Extract image URL
                        const match = bgImage.match(/url\\(["']?([^"')]+)["']?\\)/);
                        if (match) {
                            backgroundImage = match[1];
                            if (!backgroundImage.startsWith('http')) {
                                try {
                                    backgroundImage = new URL(backgroundImage, window.location.href).href;
                                } catch (e) {
                                    backgroundImage = null;
                                }
                            }
                        }
                    }

                    // Extract background positioning and sizing properties
                    backgroundProperties = {
                        size: styles.backgroundSize || 'auto',
                        position: styles.backgroundPosition || '0% 0%',
                        repeat: styles.backgroundRepeat || 'repeat',
                        attachment: styles.backgroundAttachment || 'scroll',
                        origin: styles.backgroundOrigin || 'padding-box',
                        clip: styles.backgroundClip || 'border-box'
                    };
                }

                // Collect image sources
                if (element.tagName === 'IMG' && element.src) {
                    assets.images.push(element.src);
                }

                elements.push({
                    id: `element-${processedCount}`,
                    tagName: element.tagName.toLowerCase(),
                    textContent: textContent,
                    src: element.tagName === 'IMG' ? element.src : null,
                    bounds: {
                        x: Math.round(rect.left),
                        y: Math.round(rect.top),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    },
                    styles: {
                        backgroundColor: styles.backgroundColor,
                        color: styles.color,
                        fontSize: parseFloat(styles.fontSize) || 16,
                        fontFamily: styles.fontFamily,
                        fontWeight: styles.fontWeight,
                        fontStyle: styles.fontStyle,
                        lineHeight: styles.lineHeight,
                        textAlign: styles.textAlign,
                        textDecoration: styles.textDecoration,
                        textTransform: styles.textTransform,
                        letterSpacing: styles.letterSpacing,
                        borderRadius: styles.borderRadius,
                        border: styles.border,
                        boxShadow: styles.boxShadow,
                        opacity: parseFloat(styles.opacity) || 1,
                        zIndex: parseInt(styles.zIndex) || 0
                    },
                    backgroundImage: backgroundImage,
                    backgroundGradient: backgroundGradient,
                    backgroundProperties: backgroundProperties,
                    zIndex: parseInt(styles.zIndex) || 0
                });

                processedCount++;
            }

            // Sort elements by z-index and DOM order
            elements.sort((a, b) => {
                if (a.zIndex !== b.zIndex) {
                    return a.zIndex - b.zIndex;
                }
                return 0; // Maintain DOM order for same z-index
            });

            return {
                title,
                url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                elements,
                assets,
                performance: {
                    totalElementsFound: allElements.length,
                    elementsProcessed: processedCount,
                    limitReached: processedCount >= maxElements
                }
            };
        });

        const processingTime = Date.now() - startTime;
        console.log(`Extracted ${pageData.elements.length} elements in ${processingTime}ms`);

        // Add performance warnings if needed
        const warnings = [];
        if (pageData.performance.limitReached) {
            warnings.push(`Element limit reached: processed ${pageData.performance.elementsProcessed} of ${pageData.performance.totalElementsFound} elements`);
        }
        if (processingTime > timeout * 0.8) {
            warnings.push('Processing took longer than expected, some optimizations were applied');
        }

        // Return the scraped data with performance metrics
        res.json({
            success: true,
            data: pageData,
            timestamp: new Date().toISOString(),
            performance: {
                processingTime: processingTime,
                elementsExtracted: pageData.elements.length,
                imagesFound: pageData.assets.images.length
            },
            warnings: warnings
        });

    } catch (error) {
        console.error('Scraping error:', error);

        let errorMessage = 'Failed to scrape website';
        let statusCode = 500;

        if (error.name === 'TimeoutError') {
            errorMessage = 'Website took too long to load - try a simpler page or increase timeout';
            statusCode = 408;
        } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
            errorMessage = 'Website not found or unreachable';
            statusCode = 404;
        } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
            errorMessage = 'Connection refused by website';
            statusCode = 403;
        } else if (error.message.includes('Navigation timeout')) {
            errorMessage = 'Website navigation timeout - the page took too long to load';
            statusCode = 408;
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: error.message,
            performance: {
                processingTime: Date.now() - startTime
            }
        });

    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong on our end'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist'
    });
});

// Utility function to validate URLs
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'file:';
    } catch (_) {
        return false;
    }
}

// Export for Vercel serverless deployment
export default app;

// Start server only in development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 HTML to Figma Backend running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔧 Scrape endpoint: POST http://localhost:${PORT}/scrape`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        process.exit(0);
    });
}

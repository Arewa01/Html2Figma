import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import puppeteer from 'puppeteer';

// ===== CONFIGURATION =====
const app = express();
const PORT = process.env.PORT || 4000;

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
}));

app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

app.use(express.json({ limit: '10mb' }));

// ===== SERVICES =====

class ScrapingService {
    static async scrapeWebsite(url, viewport = { width: 1200, height: 800 }) {
        let browser;

        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                timeout: 30000
            });

            const page = await browser.newPage();
            await page.setViewport(viewport);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
            await page.waitForTimeout(2000);

            const extractedData = await page.evaluate(() => {
                // Element extraction logic (runs in browser context)
                const elements = [];
                const images = [];
                let elementId = 0;

                function extractElement(el, id) {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);

                    // Skip invisible elements
                    if (rect.width === 0 && rect.height === 0) return null;
                    if (style.display === 'none' || style.visibility === 'hidden') return null;

                    return {
                        id: `el-${id}`,
                        tagName: el.tagName,
                        textContent: el.innerText?.trim() || '',
                        bounds: {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height)
                        },
                        styles: {
                            color: style.color,
                            backgroundColor: style.backgroundColor,
                            fontSize: style.fontSize,
                            fontWeight: style.fontWeight,
                            fontFamily: style.fontFamily,
                            textAlign: style.textAlign,
                            borderRadius: style.borderRadius,
                            border: style.border,
                            boxShadow: style.boxShadow,
                            opacity: style.opacity
                        },
                        src: el.tagName === 'IMG' ? el.src : null,
                        href: el.href || null,
                        alt: el.alt || null
                    };
                }

                // Extract all elements
                document.querySelectorAll('body *').forEach((el) => {
                    const element = extractElement(el, elementId++);
                    if (element) {
                        elements.push(element);

                        // Track images separately
                        if (element.tagName === 'IMG' && element.src) {
                            images.push({
                                src: element.src,
                                alt: element.alt || '',
                                bounds: element.bounds
                            });
                        }
                    }
                });

                return { elements, images };
            });

            return {
                title: await page.title(),
                elements: extractedData.elements,
                images: extractedData.images,
                viewport,
                url
            };

        } finally {
            if (browser) await browser.close();
        }
    }
}

class ElementExtractor {
    static extractAll() {
        const elements = [];
        const images = [];
        let elementId = 0;

        document.querySelectorAll('body *').forEach((el) => {
            const element = this.extractElement(el, elementId++);
            if (element) {
                elements.push(element);

                // Track images separately
                if (element.tagName === 'IMG' && element.src) {
                    images.push({
                        src: element.src,
                        alt: element.alt || '',
                        bounds: element.bounds
                    });
                }
            }
        });

        return { elements, images };
    }

    static extractElement(el, id) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        // Skip invisible elements
        if (rect.width === 0 && rect.height === 0) return null;
        if (style.display === 'none' || style.visibility === 'hidden') return null;

        return {
            id: `el-${id}`,
            tagName: el.tagName,
            textContent: el.innerText?.trim() || '',
            bounds: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            },
            styles: {
                color: style.color,
                backgroundColor: style.backgroundColor,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                fontFamily: style.fontFamily,
                textAlign: style.textAlign,
                borderRadius: style.borderRadius,
                border: style.border,
                boxShadow: style.boxShadow,
                opacity: style.opacity
            },
            src: el.tagName === 'IMG' ? el.src : null,
            href: el.href || null,
            alt: el.alt || null
        };
    }
}

class ValidationService {
    static validateUrl(url) {
        if (!url) {
            throw new Error('URL is required');
        }

        try {
            const urlObj = new URL(url);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                throw new Error('URL must use HTTP or HTTPS protocol');
            }
        } catch (error) {
            throw new Error('Invalid URL format');
        }
    }

    static validateViewport(viewport) {
        if (viewport) {
            if (viewport.width && (viewport.width < 320 || viewport.width > 3840)) {
                throw new Error('Viewport width must be between 320 and 3840');
            }
            if (viewport.height && (viewport.height < 240 || viewport.height > 2160)) {
                throw new Error('Viewport height must be between 240 and 2160');
            }
        }
    }
}

// ===== ROUTES =====

app.get('/health', (req, res) => {
    console.log('🏥 Health check requested');
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'HTML to Figma Backend'
    });
});

app.post('/scrape', async (req, res) => {
    const startTime = Date.now();
    const { url, viewport } = req.body;

    try {
        console.log(`🔍 Scraping request for: ${url}`);

        // Validate input
        ValidationService.validateUrl(url);
        ValidationService.validateViewport(viewport);

        // Scrape website
        const result = await ScrapingService.scrapeWebsite(url, viewport);

        const processingTime = Date.now() - startTime;
        console.log(`✅ Scraped ${result.elements.length} elements in ${processingTime}ms`);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
            performance: { processingTime }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Scraping error:', error.message);

        res.status(500).json({
            success: false,
            error: 'Failed to scrape website',
            details: error.message,
            timestamp: new Date().toISOString(),
            performance: { processingTime }
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist'
    });
});

// ===== SERVER STARTUP =====
app.listen(PORT, () => {
    console.log('===================================================');
    console.log(`🚀 HTML to Figma Backend Server is running ✅`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Scrape endpoint: POST http://localhost:${PORT}/scrape`);
    console.log('===================================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

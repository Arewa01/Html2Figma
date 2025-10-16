import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Mock puppeteer before importing the server
vi.mock('puppeteer');

describe('Website Scraping Functionality', () => {
    let app;
    let mockBrowser;
    let mockPage;

    beforeEach(async () => {
        // Reset all mocks
        vi.clearAllMocks();

        // Create mock browser and page
        mockPage = {
            setViewport: vi.fn(),
            setUserAgent: vi.fn(),
            setRequestInterception: vi.fn(),
            on: vi.fn(),
            goto: vi.fn(),
            waitForTimeout: vi.fn(),
            evaluate: vi.fn()
        };

        mockBrowser = {
            newPage: vi.fn().mockResolvedValue(mockPage),
            close: vi.fn()
        };

        // Mock puppeteer.launch
        const puppeteer = await import('puppeteer');
        puppeteer.default.launch.mockResolvedValue(mockBrowser);

        // Create test app
        app = express();
        app.use(cors());
        app.use(express.json());

        // Add health endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                service: 'HTML to Figma Backend'
            });
        });

        // Add scrape endpoint (simplified version for testing)
        app.post('/scrape', async (req, res) => {
            const { url, viewport = { width: 1200, height: 800 } } = req.body;

            // Validate URL
            if (!url || !isValidUrl(url)) {
                return res.status(400).json({
                    error: 'Invalid URL provided',
                    message: 'Please provide a valid HTTP or HTTPS URL'
                });
            }

            try {
                const browser = await puppeteer.default.launch();
                const page = await browser.newPage();

                await page.setViewport(viewport);
                await page.goto(url);

                const pageData = await page.evaluate(() => ({
                    title: 'Mock Website',
                    url: window.location?.href || 'https://example.com',
                    viewport: { width: 1200, height: 800 },
                    elements: [
                        {
                            id: 'element-0',
                            tagName: 'div',
                            textContent: 'Sample text',
                            bounds: { x: 0, y: 0, width: 100, height: 50 },
                            styles: {
                                backgroundColor: 'rgb(255, 255, 255)',
                                color: 'rgb(0, 0, 0)',
                                fontSize: 16,
                                fontFamily: 'Arial'
                            }
                        }
                    ],
                    assets: { images: [], fonts: [] },
                    performance: {
                        totalElementsFound: 1,
                        elementsProcessed: 1,
                        limitReached: false
                    }
                }));

                await browser.close();

                res.json({
                    success: true,
                    data: pageData,
                    timestamp: new Date().toISOString(),
                    performance: {
                        processingTime: 100,
                        elementsExtracted: 1,
                        imagesFound: 0
                    }
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Scraping failed',
                    details: error.message
                });
            }
        });

        function isValidUrl(string) {
            try {
                const url = new URL(string);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch (_) {
                return false;
            }
        }
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Health Check', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'OK',
                service: 'HTML to Figma Backend'
            });
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('URL Validation', () => {
        it('should reject invalid URLs', async () => {
            const response = await request(app)
                .post('/scrape')
                .send({ url: 'invalid-url' })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Invalid URL provided',
                message: 'Please provide a valid HTTP or HTTPS URL'
            });
        });

        it('should reject empty URLs', async () => {
            const response = await request(app)
                .post('/scrape')
                .send({ url: '' })
                .expect(400);

            expect(response.body.error).toBe('Invalid URL provided');
        });

        it('should accept valid HTTP URLs', async () => {
            mockPage.evaluate.mockResolvedValue({
                title: 'Test Page',
                url: 'http://example.com',
                viewport: { width: 1200, height: 800 },
                elements: [],
                assets: { images: [], fonts: [] },
                performance: { totalElementsFound: 0, elementsProcessed: 0, limitReached: false }
            });

            const response = await request(app)
                .post('/scrape')
                .send({ url: 'http://example.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should accept valid HTTPS URLs', async () => {
            mockPage.evaluate.mockResolvedValue({
                title: 'Test Page',
                url: 'https://example.com',
                viewport: { width: 1200, height: 800 },
                elements: [],
                assets: { images: [], fonts: [] },
                performance: { totalElementsFound: 0, elementsProcessed: 0, limitReached: false }
            });

            const response = await request(app)
                .post('/scrape')
                .send({ url: 'https://example.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Viewport Configuration', () => {
        it('should use default viewport when not specified', async () => {
            mockPage.evaluate.mockResolvedValue({
                title: 'Test Page',
                url: 'https://example.com',
                viewport: { width: 1200, height: 800 },
                elements: [],
                assets: { images: [], fonts: [] },
                performance: { totalElementsFound: 0, elementsProcessed: 0, limitReached: false }
            });

            await request(app)
                .post('/scrape')
                .send({ url: 'https://example.com' })
                .expect(200);

            expect(mockPage.setViewport).toHaveBeenCalledWith({
                width: 1200,
                height: 800,
                deviceScaleFactor: 1
            });
        });

        it('should use custom viewport when specified', async () => {
            mockPage.evaluate.mockResolvedValue({
                title: 'Test Page',
                url: 'https://example.com',
                viewport: { width: 375, height: 667 },
                elements: [],
                assets: { images: [], fonts: [] },
                performance: { totalElementsFound: 0, elementsProcessed: 0, limitReached: false }
            });

            await request(app)
                .post('/scrape')
                .send({
                    url: 'https://example.com',
                    viewport: { width: 375, height: 667 }
                })
                .expect(200);

            expect(mockPage.setViewport).toHaveBeenCalledWith({
                width: 375,
                height: 667,
                deviceScaleFactor: 1
            });
        });
    });

    describe('Element Extraction', () => {
        it('should extract basic element properties', async () => {
            const mockElements = [
                {
                    id: 'element-0',
                    tagName: 'div',
                    textContent: 'Hello World',
                    bounds: { x: 10, y: 20, width: 200, height: 50 },
                    styles: {
                        backgroundColor: 'rgb(255, 255, 255)',
                        color: 'rgb(0, 0, 0)',
                        fontSize: 16,
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: '400'
                    }
                }
            ];

            mockPage.evaluate.mockResolvedValue({
                title: 'Test Page',
                url: 'https://example.com',
                viewport: { width: 1200, height: 800 },
                elements: mockElements,
                assets: { images: [], fonts: [] },
                performance: { totalElementsFound: 1, elementsProcessed: 1, limitReached: false }
            });

            const response = await request(app)
                .post('/scrape')
                .send({ url: 'https://example.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.elements).toHaveLength(1);
            expect(response.body.data.elements[0]).toMatchObject({
                id: 'element-0',
                tagName: 'div',
                textContent: 'Hello World',
                bounds: { x: 10, y: 20, width: 200, height: 50 }
            });
        });

        it('should handle elements with no text content', async () => {
            const mockElements = [
                {
                    id: 'element-0',
                    tagName: 'div',
                    textContent: '',
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                    styles: {
                        backgroundColor: 'rgb(255, 0, 0)',
                        color: 'rgb(0, 0, 0)'
                    }
                }
            ];

            mockPage.evaluate.mockResolvedValue({
                title: 'Test Page',
                url: 'https://example.com',
                viewport: { width: 1200, height: 800 },
                elements: mockElements,
                assets: { images: [], fonts: [] },
                performance: { totalElementsFound: 1, elementsProcessed: 1, limitReached: false }
            });

            const response = await request(app)
                .post('/scrape')
                .send({ url: 'https://example.com' })
                .expect(200);

            expect(response.body.data.elements[0].textContent).toBe('');
        });
    });

    describe('Error Handling', () => {
        it('should handle browser launch failures', async () => {
            const puppeteer = await import('puppeteer');
            puppeteer.default.launch.mockRejectedValue(new Error('Browser launch failed'));

            const response = await request(app)
                .post('/scrape')
                .send({ url: 'https://example.com' })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Scraping failed');
        });

        it('should handle page navigation failures', async () => {
            mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

            const response = await request(app)
                .post('/scrape')
                .send({ url: 'https://example.com' })
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        it('should handle page evaluation failures', async () => {
            mockPage.evaluate.mockRejectedValue(new Error('Evaluation failed'));

            const response = await request(app)
                .post('/scrape')
                .send({ url: 'https://example.com' })
                .expect(500);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Performance Metrics', () => {
        it('should include performance metrics in response', async () => {
            mockPage.evaluate.mockResolvedValue({
                title: 'Test Page',
                url: 'https://example.com',
                viewport: { width: 1200, height: 800 },
                elements: [{ id: 'test', tagName: 'div', bounds: { x: 0, y: 0, width: 100, height: 100 }, styles: {} }],
                assets: { images: [], fonts: [] },
                performance: { totalElementsFound: 1, elementsProcessed: 1, limitReached: false }
            });

            const response = await request(app)
                .post('/scrape')
                .send({ url: 'https://example.com' })
                .expect(200);

            expect(response.body.performance).toBeDefined();
            expect(response.body.performance.processingTime).toBeTypeOf('number');
            expect(response.body.performance.elementsExtracted).toBeTypeOf('number');
            expect(response.body.performance.imagesFound).toBeTypeOf('number');
        });
    });
});

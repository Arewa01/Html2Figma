// Test setup for backend tests
import { vi } from 'vitest';

// Mock puppeteer
vi.mock('puppeteer', () => ({
    default: {
        launch: vi.fn(() => Promise.resolve({
            newPage: vi.fn(() => Promise.resolve({
                setViewport: vi.fn(),
                setUserAgent: vi.fn(),
                setRequestInterception: vi.fn(),
                on: vi.fn(),
                goto: vi.fn(),
                waitForTimeout: vi.fn(),
                evaluate: vi.fn(() => Promise.resolve({
                    title: 'Test Page',
                    url: 'https://example.com',
                    viewport: { width: 1200, height: 800 },
                    elements: [],
                    assets: { images: [], fonts: [] },
                    performance: {
                        totalElementsFound: 0,
                        elementsProcessed: 0,
                        limitReached: false
                    }
                }))
            })),
            close: vi.fn()
        }))
    }
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

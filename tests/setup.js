// Test setup for Figma plugin tests
import { vi } from 'vitest';

// Mock Figma API
global.figma = {
    showUI: vi.fn(),
    closePlugin: vi.fn(),
    ui: {
        postMessage: vi.fn(),
        onmessage: null
    },
    createFrame: vi.fn(() => ({
        id: 'mock-frame-id',
        name: 'Mock Frame',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fills: [],
        strokes: [],
        effects: [],
        children: [],
        appendChild: vi.fn(),
        resize: vi.fn(),
        remove: vi.fn()
    })),
    createText: vi.fn(() => ({
        id: 'mock-text-id',
        name: 'Mock Text',
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        characters: '',
        fontName: { family: 'Inter', style: 'Regular' },
        fontSize: 16,
        fills: [],
        textAlignHorizontal: 'LEFT',
        textAlignVertical: 'TOP',
        resize: vi.fn(),
        remove: vi.fn()
    })),
    createRectangle: vi.fn(() => ({
        id: 'mock-rectangle-id',
        name: 'Mock Rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fills: [],
        strokes: [],
        effects: [],
        cornerRadius: 0,
        resize: vi.fn(),
        remove: vi.fn()
    })),
    group: vi.fn(() => ({
        id: 'mock-group-id',
        name: 'Mock Group',
        children: [],
        appendChild: vi.fn(),
        remove: vi.fn()
    })),
    loadFontAsync: vi.fn().mockResolvedValue(true),
    currentPage: {
        appendChild: vi.fn(),
        children: [],
        selection: []
    },
    viewport: {
        center: { x: 0, y: 0 },
        zoom: 1
    }
};

// Mock fetch for network requests
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

// Mock setTimeout and clearTimeout
global.setTimeout = vi.fn((fn, delay) => {
    if (typeof fn === 'function') {
        fn();
    }
    return 1;
});
global.clearTimeout = vi.fn();

// Mock URL constructor
global.URL = class MockURL {
    constructor(url, base) {
        this.href = url;
        this.protocol = url.startsWith('https:') ? 'https:' : 'http:';
        this.host = 'example.com';
        this.pathname = '/';
    }
};

// Mock AbortController
global.AbortController = class MockAbortController {
    constructor() {
        this.signal = {
            aborted: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        };
    }

    abort() {
        this.signal.aborted = true;
    }
};

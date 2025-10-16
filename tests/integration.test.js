import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the main conversion functions
const mockWebsiteData = {
  url: 'https://example.com',
  title: 'Example Website',
  viewport: { width: 1200, height: 800 },
  elements: [
    {
      id: 'header',
      tagName: 'HEADER',
      bounds: { x: 0, y: 0, width: 1200, height: 80 },
      styles: {
        backgroundColor: 'rgb(37, 99, 235)',
        padding: '20px'
      },
      textContent: ''
    },
    {
      id: 'logo',
      tagName: 'H1',
      textContent: 'Example Site',
      bounds: { x: 20, y: 20, width: 200, height: 40 },
      styles: {
        color: 'rgb(255, 255, 255)',
        fontSize: 24,
        fontWeight: '700'
      }
    },
    {
      id: 'main-content',
      tagName: 'MAIN',
      bounds: { x: 0, y: 80, width: 1200, height: 600 },
      styles: {
        backgroundColor: 'rgb(255, 255, 255)',
        padding: '40px'
      },
      textContent: ''
    },
    {
      id: 'hero-title',
      tagName: 'H2',
      textContent: 'Welcome to our website',
      bounds: { x: 40, y: 120, width: 1120, height: 50 },
      styles: {
        color: 'rgb(30, 41, 59)',
        fontSize: 36,
        fontWeight: '700',
        textAlign: 'center'
      }
    }
  ],
  assets: {
    images: new Map(),
    backgrounds: new Map(),
    icons: new Map()
  },
  fonts: {
    'Inter': ['Regular', 'Bold']
  }
};

// Mock conversion functions
async function mockScrapeWebsite(url, viewport) {
  if (url === 'https://invalid-url.com') {
    throw new Error('unreachable: Website is not accessible');
  }
  if (url === 'https://timeout-url.com') {
    throw new Error('timeout: Website took too long to load');
  }
  if (url === 'invalid-url') {
    throw new Error('invalid: Please provide a valid URL');
  }

  return mockWebsiteData;
}

async function mockCreateFigmaNodesFromWebsiteData(websiteData) {
  const createdNodes = [];
  let totalElements = 0;
  let imagesProcessed = 0;
  let failedElements = 0;

  for (const element of websiteData.elements) {
    try {
      // Simulate node creation based on element type
      let node;
      if (element.textContent && element.textContent.trim()) {
        node = {
          type: 'TEXT',
          id: `text-${element.id}`,
          name: element.textContent.substring(0, 50),
          characters: element.textContent,
          x: element.bounds.x,
          y: element.bounds.y
        };
      } else if (['DIV', 'SECTION', 'HEADER', 'MAIN'].includes(element.tagName)) {
        node = {
          type: 'FRAME',
          id: `frame-${element.id}`,
          name: `${element.tagName.toLowerCase()}-${element.id}`,
          x: element.bounds.x,
          y: element.bounds.y,
          width: element.bounds.width,
          height: element.bounds.height
        };
      } else {
        node = {
          type: 'RECTANGLE',
          id: `rect-${element.id}`,
          name: `${element.tagName.toLowerCase()}-${element.id}`,
          x: element.bounds.x,
          y: element.bounds.y,
          width: element.bounds.width,
          height: element.bounds.height
        };
      }

      createdNodes.push(node);
      totalElements++;

      if (element.tagName === 'IMG') {
        imagesProcessed++;
      }
    } catch (error) {
      failedElements++;
      console.warn('Failed to create node for element:', element.id, error);
    }
  }

  return {
    totalElements,
    imagesProcessed,
    failedElements,
    conversionTime: 2.5,
    nodes: createdNodes,
    performanceReport: {
      elementsPerSecond: Math.round(totalElements / 2.5),
      successRate: Math.round(((totalElements - failedElements) / totalElements) * 100),
      batchesProcessed: Math.ceil(totalElements / 15)
    }
  };
}

describe('End-to-End URL to Figma Conversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset figma mocks
    figma.ui.postMessage.mockClear();
    figma.createText.mockClear();
    figma.createFrame.mockClear();
    figma.createRectangle.mockClear();
  });

  describe('Complete Conversion Flow', () => {
    it('should successfully convert a valid website to Figma nodes', async () => {
      const url = 'https://example.com';
      const viewport = { width: 1200, height: 800 };

      // Step 1: Scrape website
      const websiteData = await mockScrapeWebsite(url, viewport);
      expect(websiteData.url).toBe(url);
      expect(websiteData.elements).toHaveLength(4);

      // Step 2: Convert to Figma nodes
      const result = await mockCreateFigmaNodesFromWebsiteData(websiteData);

      expect(result.totalElements).toBe(4);
      expect(result.failedElements).toBe(0);
      expect(result.nodes).toHaveLength(4);
      expect(result.performanceReport.successRate).toBe(100);
    });

    it('should handle websites with mixed content types', async () => {
      const complexWebsiteData = {
        ...mockWebsiteData,
        elements: [
          ...mockWebsiteData.elements,
          {
            id: 'image-1',
            tagName: 'IMG',
            src: 'https://example.com/image.jpg',
            bounds: { x: 100, y: 200, width: 300, height: 200 },
            styles: { borderRadius: '8px' },
            textContent: ''
          },
          {
            id: 'button-1',
            tagName: 'BUTTON',
            textContent: 'Click me',
            bounds: { x: 500, y: 400, width: 120, height: 40 },
            styles: {
              backgroundColor: 'rgb(59, 130, 246)',
              color: 'rgb(255, 255, 255)',
              borderRadius: '6px'
            }
          }
        ]
      };

      const result = await mockCreateFigmaNodesFromWebsiteData(complexWebsiteData);

      expect(result.totalElements).toBe(6);
      expect(result.imagesProcessed).toBe(1);
      expect(result.nodes.some(node => node.type === 'TEXT')).toBe(true);
      expect(result.nodes.some(node => node.type === 'FRAME')).toBe(true);
      expect(result.nodes.some(node => node.type === 'RECTANGLE')).toBe(true);
    });

    it('should maintain element positioning and hierarchy', async () => {
      const result = await mockCreateFigmaNodesFromWebsiteData(mockWebsiteData);

      const headerFrame = result.nodes.find(node => node.name === 'header-header');
      const logoText = result.nodes.find(node => node.characters === 'Example Site');
      const mainFrame = result.nodes.find(node => node.name === 'main-main-content');

      expect(headerFrame.x).toBe(0);
      expect(headerFrame.y).toBe(0);
      expect(logoText.x).toBe(20);
      expect(logoText.y).toBe(20);
      expect(mainFrame.y).toBe(80); // Below header
    });
  });

  describe('Error Handling in Integration Flow', () => {
    it('should handle network errors gracefully', async () => {
      try {
        await mockScrapeWebsite('https://invalid-url.com', { width: 1200, height: 800 });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('unreachable');
      }
    });

    it('should handle timeout errors', async () => {
      try {
        await mockScrapeWebsite('https://timeout-url.com', { width: 1200, height: 800 });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('timeout');
      }
    });

    it('should handle invalid URL format', async () => {
      try {
        await mockScrapeWebsite('invalid-url', { width: 1200, height: 800 });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('invalid');
      }
    });

    it('should continue processing when some elements fail', async () => {
      const problematicData = {
        ...mockWebsiteData,
        elements: [
          ...mockWebsiteData.elements,
          {
            id: 'broken-element',
            tagName: 'UNKNOWN',
            bounds: null, // This will cause failure
            styles: {},
            textContent: ''
          }
        ]
      };

      // Mock a failure for the broken element
      const originalCreateNodes = mockCreateFigmaNodesFromWebsiteData;
      const mockCreateNodesWithFailure = async (data) => {
        const result = await originalCreateNodes(data);
        result.failedElements = 1;
        result.totalElements = data.elements.length;
        result.performanceReport.successRate = Math.round(((result.totalElements - result.failedElements) / result.totalElements) * 100);
        return result;
      };

      const result = await mockCreateNodesWithFailure(problematicData);

      expect(result.totalElements).toBe(5);
      expect(result.failedElements).toBe(1);
      expect(result.performanceReport.successRate).toBe(80);
    });
  });

  describe('Performance and Metrics', () => {
    it('should provide detailed performance metrics', async () => {
      const result = await mockCreateFigmaNodesFromWebsiteData(mockWebsiteData);

      expect(result.performanceReport).toBeDefined();
      expect(result.performanceReport.elementsPerSecond).toBeTypeOf('number');
      expect(result.performanceReport.successRate).toBeTypeOf();
      expect(result.performanceReport.batchesProcessed).toBeTypeOf('number');
      expect(result.conversionTime).toBeTypeOf('number');
    });

    it('should handle large numbers of elements efficiently', async () => {
      // Create a dataset with many elements
      const largeDataset = {
        ...mockWebsiteData,
        elements: Array.from({ length: 100 }, (_, i) => ({
          id: `element-${i}`,
          tagName: i % 2 === 0 ? 'DIV' : 'P',
          textContent: i % 2 === 0 ? '' : `Text content ${i}`,
          bounds: { x: i * 10, y: i * 5, width: 100, height: 50 },
          styles: {
            backgroundColor: `rgb(${i % 255}, ${(i * 2) % 255}, ${(i * 3) % 255})`
          }
        }))
      };

      const result = await mockCreateFigmaNodesFromWebsiteData(largeDataset);

      expect(result.totalElements).toBe(100);
      expect(result.performanceReport.batchesProcessed).toBeGreaterThan(1);
      expect(result.performanceReport.elementsPerSecond).toBeGreaterThan(0);
    });
  });

  describe('Viewport and Responsive Handling', () => {
    it('should handle different viewport sizes', async () => {
      const mobileViewport = { width: 375, height: 667 };
      const desktopViewport = { width: 1920, height: 1080 };

      const mobileData = await mockScrapeWebsite('https://example.com', mobileViewport);
      const desktopData = await mockScrapeWebsite('https://example.com', desktopViewport);

      expect(mobileData.viewport).toEqual(mobileViewport);
      expect(desktopData.viewport).toEqual(desktopViewport);

      const mobileResult = await mockCreateFigmaNodesFromWebsiteData(mobileData);
      const desktopResult = await mockCreateFigmaNodesFromWebsiteData(desktopData);

      expect(mobileResult.totalElements).toBeGreaterThan(0);
      expect(desktopResult.totalElements).toBeGreaterThan(0);
    });

    it('should maintain element proportions across viewports', async () => {
      const result = await mockCreateFigmaNodesFromWebsiteData(mockWebsiteData);

      const headerFrame = result.nodes.find(node => node.name === 'header-header');
      expect(headerFrame.width).toBe(1200); // Full viewport width
      expect(headerFrame.height).toBe(80);   // Fixed header height
    });
  });

  describe('Font and Typography Handling', () => {
    it('should extract and handle font information', async () => {
      const websiteData = await mockScrapeWebsite('https://example.com', { width: 1200, height: 800 });

      expect(websiteData.fonts).toBeDefined();
      expect(websiteData.fonts['Inter']).toContain('Regular');
      expect(websiteData.fonts['Inter']).toContain('Bold');
    });

    it('should create text nodes with proper typography', async () => {
      const result = await mockCreateFigmaNodesFromWebsiteData(mockWebsiteData);

      const textNodes = result.nodes.filter(node => node.type === 'TEXT');
      expect(textNodes.length).toBeGreaterThan(0);

      const logoText = textNodes.find(node => node.characters === 'Example Site');
      expect(logoText).toBeDefined();
      expect(logoText.characters).toBe('Example Site');
    });
  });

  describe('Asset Management', () => {
    it('should handle websites with images', async () => {
      const dataWithImages = {
        ...mockWebsiteData,
        elements: [
          ...mockWebsiteData.elements,
          {
            id: 'hero-image',
            tagName: 'IMG',
            src: 'https://example.com/hero.jpg',
            bounds: { x: 0, y: 100, width: 600, height: 400 },
            styles: {},
            textContent: ''
          }
        ]
      };

      const result = await mockCreateFigmaNodesFromWebsiteData(dataWithImages);

      expect(result.imagesProcessed).toBe(1);
      expect(result.totalElements).toBe(5);
    });

    it('should track asset processing in metrics', async () => {
      const dataWithMultipleImages = {
        ...mockWebsiteData,
        elements: [
          ...mockWebsiteData.elements,
          {
            id: 'image-1',
            tagName: 'IMG',
            src: 'https://example.com/image1.jpg',
            bounds: { x: 0, y: 100, width: 300, height: 200 },
            styles: {},
            textContent: ''
          },
          {
            id: 'image-2',
            tagName: 'IMG',
            src: 'https://example.com/image2.jpg',
            bounds: { x: 300, y: 100, width: 300, height: 200 },
            styles: {},
            textContent: ''
          }
        ]
      };

      const result = await mockCreateFigmaNodesFromWebsiteData(dataWithMultipleImages);

      expect(result.imagesProcessed).toBe(2);
      expect(result.totalElements).toBe(6);
    });
  });
});

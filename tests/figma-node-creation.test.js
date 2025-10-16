import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the FigmaNodeCreator class functionality
class MockFigmaNodeCreator {
    constructor() {
        this.loadedFonts = new Set();
        this.defaultFont = { family: "Inter", style: "Regular" };
    }

    determineNodeType(element) {
        if (element.textContent && element.textContent.trim() &&
            ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LABEL', 'BUTTON'].includes(element.tagName)) {
            return 'TEXT';
        }

        if (['DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV', 'MAIN'].includes(element.tagName)) {
            return 'FRAME';
        }

        return 'RECTANGLE';
    }

    async createNodeFromElement(element) {
        if (!element || !element.bounds) {
            return null;
        }

        if (!element.styles) {
            element.styles = {};
        }

        const nodeType = this.determineNodeType(element);

        switch (nodeType) {
            case 'TEXT':
                return await this.createTextNode(element);
            case 'FRAME':
                return await this.createFrameNode(element);
            case 'RECTANGLE':
                return await this.createRectangleNode(element);
            default:
                return await this.createRectangleNode(element);
        }
    }

    async createTextNode(element) {
        const textNode = figma.createText();

        // Load font
        await figma.loadFontAsync(this.defaultFont);

        // Set basic properties
        textNode.name = this.generateNodeName(element);
        textNode.x = element.bounds.x;
        textNode.y = element.bounds.y;
        textNode.characters = element.textContent || '';

        // Apply text styles
        if (element.styles.fontSize) {
            textNode.fontSize = element.styles.fontSize;
        }

        if (element.styles.color) {
            const color = this.parseColor(element.styles.color);
            if (color) {
                textNode.fills = [{ type: 'SOLID', color }];
            }
        }

        return textNode;
    }

    async createFrameNode(element) {
        const frameNode = figma.createFrame();

        frameNode.name = this.generateNodeName(element);
        frameNode.x = element.bounds.x;
        frameNode.y = element.bounds.y;
        frameNode.resize(element.bounds.width, element.bounds.height);

        // Apply background color
        if (element.styles.backgroundColor) {
            const color = this.parseColor(element.styles.backgroundColor);
            if (color) {
                frameNode.fills = [{ type: 'SOLID', color }];
            }
        }

        return frameNode;
    }

    async createRectangleNode(element) {
        const rectNode = figma.createRectangle();

        rectNode.name = this.generateNodeName(element);
        rectNode.x = element.bounds.x;
        rectNode.y = element.bounds.y;
        rectNode.resize(element.bounds.width, element.bounds.height);

        // Apply background color
        if (element.styles.backgroundColor) {
            const color = this.parseColor(element.styles.backgroundColor);
            if (color) {
                rectNode.fills = [{ type: 'SOLID', color }];
            }
        }

        // Apply border radius
        if (element.styles.borderRadius) {
            const radius = parseFloat(element.styles.borderRadius);
            if (!isNaN(radius)) {
                rectNode.cornerRadius = radius;
            }
        }

        return rectNode;
    }

    generateNodeName(element) {
        if (element.textContent && element.textContent.trim()) {
            return element.textContent.trim().substring(0, 50);
        }
        return `${element.tagName.toLowerCase()}-${element.id || 'element'}`;
    }

    parseColor(colorString) {
        if (!colorString || colorString === 'transparent') return null;

        // Handle rgb() format
        const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]) / 255,
                g: parseInt(rgbMatch[2]) / 255,
                b: parseInt(rgbMatch[3]) / 255
            };
        }

        // Handle hex format
        if (colorString.startsWith('#')) {
            const hex = colorString.substring(1);
            if (hex.length === 6) {
                return {
                    r: parseInt(hex.substring(0, 2), 16) / 255,
                    g: parseInt(hex.substring(2, 4), 16) / 255,
                    b: parseInt(hex.substring(4, 6), 16) / 255
                };
            }
        }

        return null;
    }
}

describe('Figma Node Creation', () => {
    let nodeCreator;

    beforeEach(() => {
        nodeCreator = new MockFigmaNodeCreator();
        vi.clearAllMocks();
    });

    describe('Node Type Determination', () => {
        it('should identify text elements correctly', () => {
            const textElement = {
                tagName: 'P',
                textContent: 'Hello World',
                bounds: { x: 0, y: 0, width: 100, height: 20 }
            };

            const nodeType = nodeCreator.determineNodeType(textElement);
            expect(nodeType).toBe('TEXT');
        });

        it('should identify heading elements as text', () => {
            const headingElement = {
                tagName: 'H1',
                textContent: 'Main Title',
                bounds: { x: 0, y: 0, width: 200, height: 40 }
            };

            const nodeType = nodeCreator.determineNodeType(headingElement);
            expect(nodeType).toBe('TEXT');
        });

        it('should identify container elements as frames', () => {
            const containerElement = {
                tagName: 'DIV',
                textContent: '',
                bounds: { x: 0, y: 0, width: 300, height: 200 }
            };

            const nodeType = nodeCreator.determineNodeType(containerElement);
            expect(nodeType).toBe('FRAME');
        });

        it('should default to rectangle for unknown elements', () => {
            const unknownElement = {
                tagName: 'UNKNOWN',
                textContent: '',
                bounds: { x: 0, y: 0, width: 100, height: 100 }
            };

            const nodeType = nodeCreator.determineNodeType(unknownElement);
            expect(nodeType).toBe('RECTANGLE');
        });
    });

    describe('Text Node Creation', () => {
        it('should create text node with correct properties', async () => {
            const textElement = {
                id: 'text-1',
                tagName: 'P',
                textContent: 'Sample text content',
                bounds: { x: 10, y: 20, width: 150, height: 25 },
                styles: {
                    fontSize: 16,
                    color: 'rgb(0, 0, 0)'
                }
            };

            const textNode = await nodeCreator.createTextNode(textElement);

            expect(figma.createText).toHaveBeenCalled();
            expect(figma.loadFontAsync).toHaveBeenCalledWith({ family: "Inter", style: "Regular" });
            expect(textNode.characters).toBe('Sample text content');
            expect(textNode.x).toBe(10);
            expect(textNode.y).toBe(20);
            expect(textNode.fontSize).toBe(16);
        });

        it('should handle empty text content', async () => {
            const textElement = {
                id: 'text-2',
                tagName: 'P',
                textContent: '',
                bounds: { x: 0, y: 0, width: 100, height: 20 },
                styles: {}
            };

            const textNode = await nodeCreator.createTextNode(textElement);

            expect(textNode.characters).toBe('');
        });

        it('should apply text color correctly', async () => {
            const textElement = {
                id: 'text-3',
                tagName: 'P',
                textContent: 'Colored text',
                bounds: { x: 0, y: 0, width: 100, height: 20 },
                styles: {
                    color: 'rgb(255, 0, 0)'
                }
            };

            const textNode = await nodeCreator.createTextNode(textElement);

            expect(textNode.fills).toEqual([{
                type: 'SOLID',
                color: { r: 1, g: 0, b: 0 }
            }]);
        });
    });

    describe('Frame Node Creation', () => {
        it('should create frame node with correct dimensions', async () => {
            const frameElement = {
                id: 'frame-1',
                tagName: 'DIV',
                textContent: '',
                bounds: { x: 50, y: 100, width: 300, height: 200 },
                styles: {
                    backgroundColor: 'rgb(240, 240, 240)'
                }
            };

            const frameNode = await nodeCreator.createFrameNode(frameElement);

            expect(figma.createFrame).toHaveBeenCalled();
            expect(frameNode.x).toBe(50);
            expect(frameNode.y).toBe(100);
            expect(frameNode.resize).toHaveBeenCalledWith(300, 200);
        });

        it('should apply background color to frame', async () => {
            const frameElement = {
                id: 'frame-2',
                tagName: 'SECTION',
                textContent: '',
                bounds: { x: 0, y: 0, width: 400, height: 300 },
                styles: {
                    backgroundColor: '#ff0000'
                }
            };

            const frameNode = await nodeCreator.createFrameNode(frameElement);

            expect(frameNode.fills).toEqual([{
                type: 'SOLID',
                color: { r: 1, g: 0, b: 0 }
            }]);
        });
    });

    describe('Rectangle Node Creation', () => {
        it('should create rectangle node with correct properties', async () => {
            const rectElement = {
                id: 'rect-1',
                tagName: 'IMG',
                textContent: '',
                bounds: { x: 25, y: 50, width: 150, height: 100 },
                styles: {
                    backgroundColor: 'rgb(0, 255, 0)',
                    borderRadius: '8px'
                }
            };

            const rectNode = await nodeCreator.createRectangleNode(rectElement);

            expect(figma.createRectangle).toHaveBeenCalled();
            expect(rectNode.x).toBe(25);
            expect(rectNode.y).toBe(50);
            expect(rectNode.resize).toHaveBeenCalledWith(150, 100);
            expect(rectNode.cornerRadius).toBe(8);
        });

        it('should handle border radius correctly', async () => {
            const rectElement = {
                id: 'rect-2',
                tagName: 'DIV',
                textContent: '',
                bounds: { x: 0, y: 0, width: 100, height: 100 },
                styles: {
                    borderRadius: '12px'
                }
            };

            const rectNode = await nodeCreator.createRectangleNode(rectElement);

            expect(rectNode.cornerRadius).toBe(12);
        });
    });

    describe('Color Parsing', () => {
        it('should parse RGB colors correctly', () => {
            const color1 = nodeCreator.parseColor('rgb(255, 128, 0)');
            expect(color1).toEqual({ r: 1, g: 0.5019607843137255, b: 0 });

            const color2 = nodeCreator.parseColor('rgb(0, 0, 0)');
            expect(color2).toEqual({ r: 0, g: 0, b: 0 });
        });

        it('should parse hex colors correctly', () => {
            const color1 = nodeCreator.parseColor('#ff0000');
            expect(color1).toEqual({ r: 1, g: 0, b: 0 });

            const color2 = nodeCreator.parseColor('#00ff00');
            expect(color2).toEqual({ r: 0, g: 1, b: 0 });
        });

        it('should handle invalid colors gracefully', () => {
            expect(nodeCreator.parseColor('transparent')).toBeNull();
            expect(nodeCreator.parseColor('invalid-color')).toBeNull();
            expect(nodeCreator.parseColor('')).toBeNull();
        });
    });

    describe('Node Name Generation', () => {
        it('should use text content for node names', () => {
            const element = {
                tagName: 'P',
                textContent: 'This is a sample text for naming',
                id: 'text-1'
            };

            const name = nodeCreator.generateNodeName(element);
            expect(name).toBe('This is a sample text for naming');
        });

        it('should truncate long text content', () => {
            const element = {
                tagName: 'P',
                textContent: 'This is a very long text content that should be truncated because it exceeds the maximum length',
                id: 'text-2'
            };

            const name = nodeCreator.generateNodeName(element);
            expect(name).toBe('This is a very long text content that should be tr');
            expect(name.length).toBe(50);
        });

        it('should use tag name and id for elements without text', () => {
            const element = {
                tagName: 'DIV',
                textContent: '',
                id: 'container-1'
            };

            const name = nodeCreator.generateNodeName(element);
            expect(name).toBe('div-container-1');
        });

        it('should handle elements without id', () => {
            const element = {
                tagName: 'SECTION',
                textContent: ''
            };

            const name = nodeCreator.generateNodeName(element);
            expect(name).toBe('section-element');
        });
    });

    describe('Error Handling', () => {
        it('should return null for invalid elements', async () => {
            const result1 = await nodeCreator.createNodeFromElement(null);
            expect(result1).toBeNull();

            const result2 = await nodeCreator.createNodeFromElement({});
            expect(result2).toBeNull();

            const result3 = await nodeCreator.createNodeFromElement({ tagName: 'DIV' });
            expect(result3).toBeNull();
        });

        it('should handle missing styles gracefully', async () => {
            const element = {
                tagName: 'P',
                textContent: 'Text without styles',
                bounds: { x: 0, y: 0, width: 100, height: 20 }
            };

            const textNode = await nodeCreator.createNodeFromElement(element);
            expect(textNode).toBeDefined();
            expect(textNode.characters).toBe('Text without styles');
        });
    });
});

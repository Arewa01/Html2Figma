import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock error scenarios for comprehensive error handling tests
describe('Error Handling and Network Failures', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch.mockClear();
    });

    describe('URL Validation Errors', () => {
        it('should reject malformed URLs', () => {
            const invalidUrls = [
                '',
                'not-a-url',
                'ftp://example.com',
                'javascript:alert("xss")',
                'data:text/html,<script>alert("xss")</script>',
                'file:///etc/passwd',
                'http://',
                'https://',
                'http://.',
                'https://.',
                'http://..',
                'https://..'
            ];

            invalidUrls.forEach(url => {
                expect(() => {
                    new URL(url);
                }).toThrow();
            });
        });

        it('should accept valid URLs', () => {
            const validUrls = [
                'http://example.com',
                'https://example.com',
                'https://www.example.com',
                'https://subdomain.example.com',
                'https://example.com/path',
                'https://example.com/path?query=value',
                'https://example.com:8080',
                'http://localhost:3000'
            ];

            validUrls.forEach(url => {
                expect(() => {
                    new URL(url);
                }).not.toThrow();
            });
        });

        it('should categorize URL validation errors correctly', () => {
            function categorizeUrlError(url) {
                try {
                    new URL(url);
                    return null;
                } catch (error) {
                    if (!url || url.trim() === '') {
                        return 'empty';
                    }
                    if (url.startsWith('javascript:') || url.startsWith('data:')) {
                        return 'security';
                    }
                    if (url.startsWith('ftp:') || url.startsWith('file:')) {
                        return 'unsupported_protocol';
                    }
                    return 'malformed';
                }
            }

            expect(categorizeUrlError('')).toBe('empty');
            expect(categorizeUrlError('javascript:alert(1)')).toBe('security');
            expect(categorizeUrlError('ftp://example.com')).toBe('unsupported_protocol');
            expect(categorizeUrlError('not-a-url')).toBe('malformed');
        });
    });

    describe('Network Connection Failures', () => {
        it('should handle network timeout errors', async () => {
            global.fetch.mockImplementation(() =>
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('timeout')), 100);
                })
            );

            try {
                await fetch('https://example.com', { signal: new AbortController().signal });
                expect.fail('Should have thrown timeout error');
            } catch (error) {
                expect(error.message).toBe('timeout');
            }
        });

        it('should handle connection refused errors', async () => {
            global.fetch.mockRejectedValue(new Error('Connection refused'));

            try {
                await fetch('https://unreachable.com');
                expect.fail('Should have thrown connection error');
            } catch (error) {
                expect(error.message).toBe('Connection refused');
            }
        });

        it('should handle DNS resolution failures', async () => {
            global.fetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND nonexistent.domain'));

            try {
                await fetch('https://nonexistent.domain');
                expect.fail('Should have thrown DNS error');
            } catch (error) {
                expect(error.message).toContain('ENOTFOUND');
            }
        });

        it('should handle SSL certificate errors', async () => {
            global.fetch.mockRejectedValue(new Error('certificate verify failed'));

            try {
                await fetch('https://self-signed.badssl.com');
                expect.fail('Should have thrown SSL error');
            } catch (error) {
                expect(error.message).toContain('certificate');
            }
        });
    });

    describe('HTTP Response Errors', () => {
        it('should handle 404 Not Found errors', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: () => Promise.resolve({ error: 'Page not found' })
            });

            const response = await fetch('https://example.com/nonexistent');
            expect(response.ok).toBe(false);
            expect(response.status).toBe(404);
        });

        it('should handle 403 Forbidden errors', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                json: () => Promise.resolve({ error: 'Access denied' })
            });

            const response = await fetch('https://example.com/forbidden');
            expect(response.ok).toBe(false);
            expect(response.status).toBe(403);
        });

        it('should handle 500 Internal Server Error', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: () => Promise.resolve({ error: 'Server error' })
            });

            const response = await fetch('https://example.com/error');
            expect(response.ok).toBe(false);
            expect(response.status).toBe(500);
        });

        it('should handle rate limiting (429 Too Many Requests)', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                headers: {
                    get: (name) => name === 'Retry-After' ? '60' : null
                },
                json: () => Promise.resolve({ error: 'Rate limit exceeded' })
            });

            const response = await fetch('https://example.com/api');
            expect(response.ok).toBe(false);
            expect(response.status).toBe(429);
            expect(response.headers.get('Retry-After')).toBe('60');
        });
    });

    describe('Backend Service Errors', () => {
        it('should handle backend service unavailable', async () => {
            global.fetch.mockRejectedValue(new Error('fetch failed'));

            async function testBackendConnection() {
                try {
                    const response = await fetch('http://localhost:3000/health');
                    return response.ok;
                } catch (error) {
                    return false;
                }
            }

            const isAvailable = await testBackendConnection();
            expect(isAvailable).toBe(false);
        });

        it('should handle malformed backend responses', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.reject(new Error('Invalid JSON'))
            });

            try {
                const response = await fetch('http://localhost:3000/scrape');
                await response.json();
                expect.fail('Should have thrown JSON parsing error');
            } catch (error) {
                expect(error.message).toBe('Invalid JSON');
            }
        });

        it('should handle backend timeout during scraping', async () => {
            global.fetch.mockImplementation(() =>
                new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            ok: false,
                            status: 408,
                            statusText: 'Request Timeout',
                            json: () => Promise.resolve({
                                success: false,
                                error: 'Website took too long to load'
                            })
                        });
                    }, 100);
                })
            );

            const response = await fetch('http://localhost:3000/scrape', {
                method: 'POST',
                body: JSON.stringify({ url: 'https://slow-website.com' })
            });

            expect(response.status).toBe(408);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toContain('took too long');
        });
    });

    describe('Figma API Errors', () => {
        it('should handle font loading failures', async () => {
            figma.loadFontAsync.mockRejectedValue(new Error('Font not found'));

            try {
                await figma.loadFontAsync({ family: 'NonexistentFont', style: 'Regular' });
                expect.fail('Should have thrown font loading error');
            } catch (error) {
                expect(error.message).toBe('Font not found');
            }
        });

        it('should handle node creation failures', () => {
            figma.createText.mockImplementation(() => {
                throw new Error('Failed to create text node');
            });

            expect(() => {
                figma.createText();
            }).toThrow('Failed to create text node');
        });

        it('should handle plugin UI communication errors', () => {
            figma.ui.postMessage.mockImplementation(() => {
                throw new Error('UI communication failed');
            });

            expect(() => {
                figma.ui.postMessage({ type: 'test' });
            }).toThrow('UI communication failed');
        });
    });

    describe('Error Recovery and Retry Logic', () => {
        it('should implement exponential backoff for retries', () => {
            function calculateBackoffDelay(retryCount, baseDelay = 1000, maxDelay = 10000) {
                const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
                return delay;
            }

            expect(calculateBackoffDelay(0)).toBe(1000);   // 1 second
            expect(calculateBackoffDelay(1)).toBe(2000);   // 2 seconds
            expect(calculateBackoffDelay(2)).toBe(4000);   // 4 seconds
            expect(calculateBackoffDelay(3)).toBe(8000);   // 8 seconds
            expect(calculateBackoffDelay(4)).toBe(10000);  // Capped at 10 seconds
            expect(calculateBackoffDelay(5)).toBe(10000);  // Still capped
        });

        it('should determine if errors are retryable', () => {
            function isRetryableError(error) {
                const retryableErrors = [
                    'timeout',
                    'network',
                    'ECONNRESET',
                    'ENOTFOUND',
                    'ETIMEDOUT'
                ];

                return retryableErrors.some(retryable =>
                    error.message.toLowerCase().includes(retryable.toLowerCase())
                );
            }

            expect(isRetryableError(new Error('timeout'))).toBe(true);
            expect(isRetryableError(new Error('network error'))).toBe(true);
            expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
            expect(isRetryableError(new Error('Invalid URL'))).toBe(false);
            expect(isRetryableError(new Error('403 Forbidden'))).toBe(false);
        });

        it('should limit retry attempts', async () => {
            let attemptCount = 0;
            const maxRetries = 3;

            async function mockRetryableOperation() {
                attemptCount++;
                if (attemptCount <= maxRetries) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            }

            async function retryOperation(operation, maxAttempts = 3) {
                let lastError;

                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    try {
                        return await operation();
                    } catch (error) {
                        lastError = error;
                        if (attempt === maxAttempts - 1) {
                            throw error;
                        }
                    }
                }
            }

            try {
                await retryOperation(mockRetryableOperation, maxRetries);
                expect.fail('Should have thrown after max retries');
            } catch (error) {
                expect(error.message).toBe('Temporary failure');
                expect(attemptCount).toBe(maxRetries);
            }
        });
    });

    describe('Error Message Categorization', () => {
        it('should provide user-friendly error messages', () => {
            function categorizeError(error) {
                const errorMessage = error.message.toLowerCase();

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

            const networkError = categorizeError(new Error('network failed'));
            expect(networkError.userMessage).toBe('Network Connection Error');
            expect(networkError.canRetry).toBe(true);

            const timeoutError = categorizeError(new Error('timeout occurred'));
            expect(timeoutError.userMessage).toBe('Request Timeout');
            expect(timeoutError.canRetry).toBe(true);

            const invalidError = categorizeError(new Error('invalid URL'));
            expect(invalidError.userMessage).toBe('Invalid Input');
            expect(invalidError.canRetry).toBe(false);

            const genericError = categorizeError(new Error('unknown error'));
            expect(genericError.userMessage).toBe('Conversion Error');
            expect(genericError.canRetry).toBe(true);
        });

        it('should provide contextual suggestions based on error type', () => {
            function getErrorSuggestions(errorType) {
                const suggestions = {
                    network: [
                        'Check your internet connection',
                        'Ensure the backend service is running',
                        'Try again in a few moments'
                    ],
                    timeout: [
                        'Try a simpler website first',
                        'Check if the website is responsive',
                        'Try again with a smaller viewport size'
                    ],
                    invalid_url: [
                        'Ensure the URL starts with http:// or https://',
                        'Check for typos in the URL',
                        'Try a different website'
                    ],
                    rate_limit: [
                        'Wait a few minutes before trying again',
                        'The website may be blocking automated requests',
                        'Try a different page on the same website'
                    ],
                    server_error: [
                        'The website may be experiencing issues',
                        'Try again later',
                        'Contact the website administrator if the problem persists'
                    ]
                };

                return suggestions[errorType] || [
                    'Try again in a few moments',
                    'Try a different website',
                    'Check the browser console for more details'
                ];
            }

            expect(getErrorSuggestions('network')).toContain('Check your internet connection');
            expect(getErrorSuggestions('timeout')).toContain('Try a simpler website first');
            expect(getErrorSuggestions('invalid_url')).toContain('Ensure the URL starts with http://');
            expect(getErrorSuggestions('unknown')).toContain('Try again in a few moments');
        });
    });

    describe('Graceful Degradation', () => {
        it('should continue processing when non-critical elements fail', () => {
            const elements = [
                { id: 'valid-1', tagName: 'DIV', bounds: { x: 0, y: 0, width: 100, height: 100 } },
                { id: 'invalid', tagName: 'DIV', bounds: null }, // This will fail
                { id: 'valid-2', tagName: 'P', textContent: 'Text', bounds: { x: 0, y: 100, width: 100, height: 20 } }
            ];

            const results = [];
            const errors = [];

            elements.forEach(element => {
                try {
                    if (!element.bounds) {
                        throw new Error('Invalid element bounds');
                    }
                    results.push({ success: true, element: element.id });
                } catch (error) {
                    errors.push({ error: error.message, element: element.id });
                    // Continue processing other elements
                }
            });

            expect(results).toHaveLength(2);
            expect(errors).toHaveLength(1);
            expect(errors[0].element).toBe('invalid');
        });

        it('should provide partial results when some operations fail', () => {
            function processElementsBatch(elements) {
                const results = {
                    successful: [],
                    failed: [],
                    totalProcessed: 0,
                    successRate: 0
                };

                elements.forEach(element => {
                    results.totalProcessed++;

                    try {
                        // Simulate processing that might fail
                        if (element.id === 'problematic') {
                            throw new Error('Processing failed');
                        }

                        results.successful.push(element.id);
                    } catch (error) {
                        results.failed.push({ id: element.id, error: error.message });
                    }
                });

                results.successRate = (results.successful.length / results.totalProcessed) * 100;
                return results;
            }

            const testElements = [
                { id: 'element-1' },
                { id: 'problematic' },
                { id: 'element-2' },
                { id: 'element-3' }
            ];

            const results = processElementsBatch(testElements);

            expect(results.totalProcessed).toBe(4);
            expect(results.successful).toHaveLength(3);
            expect(results.failed).toHaveLength(1);
            expect(results.successRate).toBe(75);
        });
    });
});

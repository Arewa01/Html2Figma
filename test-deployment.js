#!/usr/bin/env node

/**
 * Test script for HTML to Figma Plugin deployment
 * This script tests the backend service and plugin configuration
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const CONFIG_FILE = 'code.js';
const TEST_URL = 'https://example.com';

console.log('🧪 HTML to Figma Plugin Deployment Test');
console.log('=====================================\n');

// Extract backend URL from code.js
function extractBackendUrl() {
    try {
        const codeContent = fs.readFileSync(CONFIG_FILE, 'utf8');
        const match = codeContent.match(/BACKEND_URL:\s*['"]([^'"]+)['"]/);

        if (match) {
            return match[1];
        } else {
            throw new Error('BACKEND_URL not found in code.js');
        }
    } catch (error) {
        console.error('❌ Error reading configuration:', error.message);
        process.exit(1);
    }
}

// Test HTTP/HTTPS request
function testRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        const timeout = options.timeout || 10000;

        const req = client.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

// Test backend health endpoint
async function testHealthEndpoint(backendUrl) {
    console.log('🔍 Testing health endpoint...');

    try {
        const response = await testRequest(`${backendUrl}/health`);

        if (response.statusCode === 200) {
            const healthData = JSON.parse(response.data);
            console.log('✅ Health check passed');
            console.log(`   Status: ${healthData.status}`);
            console.log(`   Service: ${healthData.service}`);
            console.log(`   Timestamp: ${healthData.timestamp}`);
            return true;
        } else {
            console.log(`❌ Health check failed: HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Health check failed: ${error.message}`);
        return false;
    }
}

// Test scraping endpoint
async function testScrapeEndpoint(backendUrl) {
    console.log('🔍 Testing scrape endpoint...');

    const requestBody = JSON.stringify({
        url: TEST_URL,
        viewport: { width: 1200, height: 800 },
        timeout: 30000
    });

    try {
        const response = await testRequest(`${backendUrl}/scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            },
            body: requestBody,
            timeout: 35000
        });

        if (response.statusCode === 200) {
            const scrapeData = JSON.parse(response.data);

            if (scrapeData.success) {
                console.log('✅ Scrape test passed');
                console.log(`   Elements found: ${scrapeData.data.elements?.length || 0}`);
                console.log(`   Page title: ${scrapeData.data.title || 'N/A'}`);
                console.log(`   Processing time: ${scrapeData.performance?.processingTime || 'N/A'}ms`);
                return true;
            } else {
                console.log(`❌ Scrape test failed: ${scrapeData.error}`);
                return false;
            }
        } else {
            console.log(`❌ Scrape test failed: HTTP ${response.statusCode}`);
            console.log(`   Response: ${response.data}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Scrape test failed: ${error.message}`);
        return false;
    }
}

// Test CORS headers
async function testCorsHeaders(backendUrl) {
    console.log('🔍 Testing CORS configuration...');

    try {
        const response = await testRequest(`${backendUrl}/health`, {
            headers: {
                'Origin': 'https://www.figma.com'
            }
        });

        const corsHeader = response.headers['access-control-allow-origin'];

        if (corsHeader && (corsHeader === '*' || corsHeader.includes('figma.com'))) {
            console.log('✅ CORS configuration is correct');
            console.log(`   Access-Control-Allow-Origin: ${corsHeader}`);
            return true;
        } else {
            console.log('⚠️  CORS configuration may need adjustment');
            console.log(`   Access-Control-Allow-Origin: ${corsHeader || 'Not set'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ CORS test failed: ${error.message}`);
        return false;
    }
}

// Main test function
async function runTests() {
    const backendUrl = extractBackendUrl();

    console.log(`📍 Backend URL: ${backendUrl}\n`);

    // Run tests
    const healthTest = await testHealthEndpoint(backendUrl);
    console.log('');

    const corsTest = await testCorsHeaders(backendUrl);
    console.log('');

    const scrapeTest = await testScrapeEndpoint(backendUrl);
    console.log('');

    // Summary
    console.log('📊 Test Summary:');
    console.log('================');
    console.log(`Health Endpoint: ${healthTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`CORS Headers: ${corsTest ? '✅ PASS' : '⚠️  WARNING'}`);
    console.log(`Scrape Functionality: ${scrapeTest ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = healthTest && scrapeTest;

    console.log('\n🎯 Overall Status:');
    if (allPassed) {
        console.log('✅ All critical tests passed! Your deployment is ready.');
        console.log('🚀 You can now use the plugin in Figma.');
    } else {
        console.log('❌ Some tests failed. Please check the configuration and try again.');
        console.log('💡 Common issues:');
        console.log('   - Backend service not deployed or accessible');
        console.log('   - Incorrect BACKEND_URL in code.js');
        console.log('   - Network connectivity issues');
        console.log('   - Backend service configuration problems');
    }

    console.log('\n📚 Next Steps:');
    console.log('1. Import the plugin in Figma (Plugins → Development → Import plugin from manifest)');
    console.log('2. Test with a simple website like https://example.com');
    console.log('3. Check the plugin documentation for troubleshooting tips');

    process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch((error) => {
    console.error('💥 Test runner error:', error);
    process.exit(1);
});

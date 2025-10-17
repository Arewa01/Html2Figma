#!/usr/bin/env node

/**
 * Test chrome-aws-lambda setup
 */

import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

console.log('🧪 Testing chrome-aws-lambda setup...\n');

async function testSetup() {
    try {
        console.log('📦 Chrome AWS Lambda Info:');
        console.log(`   Headless: ${chromium.headless}`);
        console.log(`   Default Viewport: ${JSON.stringify(chromium.defaultViewport)}`);
        console.log(`   Args count: ${chromium.args.length}`);

        console.log('\n🔧 Getting executable path...');
        const executablePath = await chromium.executablePath;
        console.log(`   Executable Path: ${executablePath || 'NOT FOUND'}`);

        if (!executablePath) {
            throw new Error('chrome-aws-lambda executable path is empty');
        }

        console.log('\n🚀 Testing browser launch...');
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: executablePath,
            headless: chromium.headless,
        });

        console.log('✅ Browser launched successfully!');

        const page = await browser.newPage();
        console.log('✅ New page created!');

        await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 10000 });
        const title = await page.title();
        console.log(`✅ Page loaded: "${title}"`);

        await browser.close();
        console.log('✅ Browser closed successfully!');

        console.log('\n🎉 chrome-aws-lambda is working correctly!');
        console.log('✅ Ready for Vercel deployment');

    } catch (error) {
        console.error('\n❌ chrome-aws-lambda test failed:');
        console.error(`   Error: ${error.message}`);
        console.error('\n💡 Possible issues:');
        console.error('   - chrome-aws-lambda not installed correctly');
        console.error('   - Version incompatibility with puppeteer-core');
        console.error('   - Missing system dependencies');
        console.error('\n🔧 Try:');
        console.error('   npm uninstall puppeteer');
        console.error('   npm install puppeteer-core@^10.4.0 chrome-aws-lambda@^10.1.0');

        process.exit(1);
    }
}

testSetup();

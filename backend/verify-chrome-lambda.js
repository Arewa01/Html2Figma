#!/usr/bin/env node

/**
 * Verify chrome-aws-lambda setup
 * This script tests if chrome-aws-lambda is working correctly
 */

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

console.log('🔍 Verifying @sparticuz/chromium setup...\n');

async function verifySetup() {
    try {
        console.log('📦 Sparticuz Chromium Info:');
        console.log(`   Headless: true (default)`);
        console.log(`   Args: ${JSON.stringify(chromium.args)}`);

        console.log('\n🔧 Getting executable path...');
        const executablePath = await chromium.executablePath;
        console.log(`   Executable Path: ${executablePath || 'Not found'}`);

        console.log('\n🚀 Testing browser launch...');
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 1280, height: 720 },
            executablePath: executablePath || undefined,
            headless: true,
        });

        console.log('✅ Browser launched successfully!');

        const page = await browser.newPage();
        await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 10000 });

        const title = await page.title();
        console.log(`✅ Page loaded successfully: "${title}"`);

        await browser.close();
        console.log('✅ Browser closed successfully!');

        console.log('\n🎉 Sparticuz Chromium setup is working correctly!');
        console.log('✅ Ready for Vercel deployment');

    } catch (error) {
        console.error('\n❌ Sparticuz Chromium setup failed:');
        console.error(`   Error: ${error.message}`);
        console.error('\n💡 Possible issues:');
        console.error('   - @sparticuz/chromium not installed correctly');
        console.error('   - puppeteer-core version incompatibility');
        console.error('   - Missing system dependencies');
        console.error('\n🔧 Try:');
        console.error('   npm install @sparticuz/chromium puppeteer-core');
        console.error('   npm uninstall puppeteer  # Remove if present');

        process.exit(1);
    }
}

verifySetup();

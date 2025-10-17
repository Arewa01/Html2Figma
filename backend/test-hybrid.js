#!/usr/bin/env node

/**
 * Test hybrid puppeteer setup (works locally and on Vercel)
 */

console.log('🧪 Testing hybrid Puppeteer setup...\n');

async function testSetup() {
    try {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

        console.log(`📦 Environment: ${isProduction ? 'Production' : 'Development'}`);

        let puppeteer, chromium, browserConfig;

        if (isProduction) {
            console.log('🔧 Loading puppeteer-core + chrome-aws-lambda...');
            puppeteer = (await import('puppeteer-core')).default;
            chromium = (await import('chrome-aws-lambda')).default;

            const executablePath = await chromium.executablePath;
            console.log(`   Executable Path: ${executablePath || 'NOT FOUND'}`);

            if (!executablePath) {
                throw new Error('chrome-aws-lambda executable path is empty');
            }

            browserConfig = {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: executablePath,
                headless: chromium.headless,
            };
        } else {
            console.log('🔧 Loading regular puppeteer...');
            puppeteer = (await import('puppeteer')).default;

            browserConfig = {
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ]
            };
        }

        console.log('\n🚀 Testing browser launch...');
        const browser = await puppeteer.launch(browserConfig);

        console.log('✅ Browser launched successfully!');

        const page = await browser.newPage();
        console.log('✅ New page created!');

        await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 10000 });
        const title = await page.title();
        console.log(`✅ Page loaded: "${title}"`);

        await browser.close();
        console.log('✅ Browser closed successfully!');

        console.log('\n🎉 Hybrid setup is working correctly!');
        console.log('✅ Ready for both local development and Vercel deployment');

    } catch (error) {
        console.error('\n❌ Hybrid setup test failed:');
        console.error(`   Error: ${error.message}`);
        console.error('\n💡 Possible issues:');
        console.error('   - Missing dependencies');
        console.error('   - Chrome not installed locally');
        console.error('   - Version incompatibility');

        process.exit(1);
    }
}

testSetup();

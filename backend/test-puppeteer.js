import puppeteer from 'puppeteer';

async function testPuppeteer() {
    console.log('Testing Puppeteer...');

    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        console.log('Browser launched successfully!');

        console.log('Creating new page...');
        const page = await browser.newPage();

        console.log('Setting viewport...');
        await page.setViewport({ width: 1200, height: 800 });

        console.log('Navigating to example.com...');
        await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

        console.log('Getting page title...');
        const title = await page.title();
        console.log('Page title:', title);

        console.log('Closing browser...');
        await browser.close();

        console.log('✅ Puppeteer test successful!');

    } catch (error) {
        console.error('❌ Puppeteer test failed:', error.message);
        console.error('Full error:', error);
    }
}

testPuppeteer();

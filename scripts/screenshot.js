const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });

    // Login first
    await page.goto('http://localhost:5173/login');
    await page.type('input[type="email"]', 'farmer@local.com');
    await page.type('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go to dashboard
    await page.goto('http://localhost:5173/farmer-dashboard');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/8cfaf95e-ae1f-4a7c-a87d-4f67b37b358f/farmer_dashboard_desktop.png', fullPage: true });
    await browser.close();
})();

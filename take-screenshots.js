const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log("Starting screenshot capture...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create artifacts dir if it doesn't exist
  const outputDir = 'C:\\Users\\Nzaka\\.gemini\\antigravity-ide\\brain\\6e7cb8ca-1734-45b5-bb27-9d7bd254198f';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 1. Client login
    console.log("Logging in as Client...");
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[placeholder="7XX XXX XXX"]');
    await page.fill('input[placeholder="7XX XXX XXX"]', '712345678');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/verify\?phone=.+/);
    const loginInputs = await page.$$('input');
    await loginInputs[0].fill('1');
    await loginInputs[1].fill('2');
    await loginInputs[2].fill('3');
    await loginInputs[3].fill('4');
    await page.click('button:has-text("Verify")');
    
    // Wait for redirect to /client/dashboard
    await page.waitForURL('**/client/dashboard', { timeout: 10000 });
    // Hard reload
    await page.reload({ waitUntil: 'networkidle' });
    console.log("Taking screenshot of Client Dashboard...");
    await page.waitForTimeout(2000); // wait for images to load
    await page.screenshot({ path: path.join(outputDir, 'client_dashboard_reloaded.png'), fullPage: true });

    // Navigate to /client/bookings
    console.log("Navigating to Client Bookings...");
    await page.goto('http://localhost:3000/client/bookings', { waitUntil: 'networkidle' });
    console.log("Taking screenshot of Client Bookings...");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'client_bookings_reloaded.png'), fullPage: true });

    // 2. Barber login
    // Clear state
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    console.log("Logging in as Barber...");
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[placeholder="7XX XXX XXX"]');
    await page.fill('input[placeholder="7XX XXX XXX"]', '700000000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/verify\?phone=.+/);
    const loginInputs2 = await page.$$('input');
    await loginInputs2[0].fill('1');
    await loginInputs2[1].fill('2');
    await loginInputs2[2].fill('3');
    await loginInputs2[3].fill('4');
    await page.click('button:has-text("Verify")');

    // Wait for redirect to /barber/dashboard
    await page.waitForURL('**/barber/dashboard', { timeout: 10000 });
    // Hard reload
    await page.reload({ waitUntil: 'networkidle' });
    console.log("Taking screenshot of Barber Dashboard...");
    await page.waitForTimeout(2000); // wait for images to load
    await page.screenshot({ path: path.join(outputDir, 'barber_dashboard_reloaded.png'), fullPage: true });

  } catch (e) {
    console.error("❌ SCRIPT FAILED:", e);
  } finally {
    await browser.close();
    console.log("Screenshot capture finished.");
  }
})();

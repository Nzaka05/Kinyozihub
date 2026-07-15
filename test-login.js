const { chromium } = require('playwright');

(async () => {
  console.log("Starting existing user login test...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const PHONE_NUMBER = "712345678";

  try {
    console.log("=== EXISTING USER LOGIN ===");
    console.log("Navigating to /login...");
    await page.goto('http://localhost:3000/login');
    
    await page.waitForSelector('input[placeholder="7XX XXX XXX"]');
    await page.fill('input[placeholder="7XX XXX XXX"]', PHONE_NUMBER);
    console.log(`Filled phone number: ${PHONE_NUMBER}`);
    
    await page.click('button[type="submit"]');
    console.log("Clicked 'Log In' / 'Send Code'");
    
    await page.waitForURL(/\/verify\?phone=.+/);
    console.log("Arrived at /verify");

    const loginInputs = await page.$$('input');
    await loginInputs[0].fill('1');
    await loginInputs[1].fill('2');
    await loginInputs[2].fill('3');
    await loginInputs[3].fill('4');
    console.log("Filled OTP (1234)");

    await page.click('button:has-text("Verify")');
    console.log("Clicked 'Verify'");

    await page.waitForURL('http://localhost:3000/client/dashboard');
    console.log("Navigated directly to /client/dashboard (Bypassed role-selection)");

    const loginContent = await page.content();
    if (loginContent.includes('This page could not be found') || loginContent.includes('404')) {
      console.log("✅ Successfully hit 404 page for /client/dashboard on login (No crash!)");
    } else {
      console.log("⚠️ Did not find 404 text. Content snippets:", loginContent.substring(0, 200));
    }

  } catch (e) {
    console.error("❌ TEST FAILED:", e);
  } finally {
    await browser.close();
    console.log("Test finished.");
  }
})();

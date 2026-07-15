const { chromium } = require('playwright');

(async () => {
  console.log("Starting full walkthrough test...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const PHONE_NUMBER = "712345678"; // Registration flow
  const EXISTING_PHONE = "798765432"; // We will register this first, then test login

  try {
    // ----------------------------------------------------
    // SCENARIO 1: NEW REGISTRATION
    // ----------------------------------------------------
    console.log("=== SCENARIO 1: NEW REGISTRATION ===");
    console.log("Navigating to /register...");
    await page.goto('http://localhost:3000/register');
    
    // Fill phone number
    await page.waitForSelector('input[placeholder="7XX XXX XXX"]');
    await page.fill('input[placeholder="7XX XXX XXX"]', PHONE_NUMBER);
    console.log(`Filled phone number: ${PHONE_NUMBER}`);
    
    // Submit
    await page.click('button[type="submit"]');
    console.log("Clicked 'Send Code'");
    
    // Wait for Verify page
    await page.waitForURL(/\/verify\?phone=.+/);
    console.log("Arrived at /verify");

    // Enter OTP '1234'
    await page.waitForSelector('input'); // The OTP inputs
    const inputs = await page.$$('input');
    await inputs[0].fill('1');
    await inputs[1].fill('2');
    await inputs[2].fill('3');
    await inputs[3].fill('4');
    console.log("Filled OTP (1234)");

    // Submit Verify
    await page.click('button:has-text("Verify")');
    console.log("Clicked 'Verify'");

    // Wait for Role Selection page
    await page.waitForURL('http://localhost:3000/role-selection');
    console.log("Arrived at /role-selection");

    // Select Client
    await page.click(`label:has-text("I'm a Client")`);
    console.log("Selected Client role");
    
    // Submit Role
    await page.click('button:has-text("Continue")');
    console.log("Clicked 'Continue'");

    // Wait for navigation to /client/dashboard
    await page.waitForURL('http://localhost:3000/client/dashboard');
    console.log("Navigated to /client/dashboard");

    // Check if we hit a 404 cleanly
    const content = await page.content();
    if (content.includes('This page could not be found') || content.includes('404')) {
      console.log("✅ Successfully hit 404 page for /client/dashboard (No crash!)");
    } else {
      console.log("⚠️ Did not find 404 text. Content snippets:", content.substring(0, 200));
    }


    // ----------------------------------------------------
    // SCENARIO 2: EXISTING USER LOGIN
    // ----------------------------------------------------
    console.log("\n=== SCENARIO 2: EXISTING USER LOGIN ===");
    
    // First, clear cookies/storage to simulate fresh session
    await context.clearCookies();
    await context.clearPermissions();
    
    console.log("Navigating to /login...");
    await page.goto('http://localhost:3000/login');
    
    // Fill same phone number
    await page.waitForSelector('input[placeholder="7XX XXX XXX"]');
    await page.fill('input[placeholder="7XX XXX XXX"]', PHONE_NUMBER);
    console.log(`Filled existing phone number: ${PHONE_NUMBER}`);
    
    // Submit
    await page.click('button[type="submit"]');
    console.log("Clicked 'Send Code'");
    
    // Wait for Verify page
    await page.waitForURL(/\/verify\?phone=.+/);
    console.log("Arrived at /verify");

    // Enter OTP '1234'
    const loginInputs = await page.$$('input');
    await loginInputs[0].fill('1');
    await loginInputs[1].fill('2');
    await loginInputs[2].fill('3');
    await loginInputs[3].fill('4');
    console.log("Filled OTP (1234)");

    // Submit Verify
    await page.click('button:has-text("Verify")');
    console.log("Clicked 'Verify'");

    // Since user is already registered and role is Client, they should go directly to dashboard
    await page.waitForURL('http://localhost:3000/client/dashboard');
    console.log("Navigated directly to /client/dashboard (Bypassed role-selection)");

    // Check if we hit a 404 cleanly
    const loginContent = await page.content();
    if (loginContent.includes('This page could not be found') || loginContent.includes('404')) {
      console.log("✅ Successfully hit 404 page for /client/dashboard on login (No crash!)");
    } else {
      console.log("⚠️ Did not find 404 text. Content snippets:", loginContent.substring(0, 200));
    }

  } catch (e) {
    console.error("❌ TEST FAILED:", e);
    // Take a screenshot of the failure
    await page.screenshot({ path: 'test-failure.png' });
    console.log("Screenshot saved to test-failure.png");
  } finally {
    await browser.close();
    console.log("Test finished.");
  }
})();

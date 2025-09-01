const { test, expect } = require('@playwright/test');

test.describe('Database Feature', () => {
  test('should allow a user to create, save, and delete a trace', async ({ page }) => {
    // 1. Navigate to the app
    await page.goto('http://localhost:80');

    // 2. Wait for the map to be ready (wait for a known element)
    await expect(page.locator('#mapid')).toBeVisible();
    await page.waitForLoadState('networkidle');

    // 3. Create a new trace
    await page.locator('#manual').click();
    await page.locator('#mapid').click({ position: { x: 200, y: 200 } });
    await page.locator('#mapid').click({ position: { x: 300, y: 300 } });

    // 4. Finish drawing
    await page.locator('#edit').click(); // Click the checkmark to validate

    // 5. Rename the trace
    const traceTab = page.locator('.tab-draggable');
    await traceTab.dblclick();
    await page.locator('.input-minimal').fill('My E2E Test Trace');
    await page.locator('.input-minimal').press('Enter');
    await expect(traceTab).toContainText('My E2E Test Trace');

    // 6. Save the trace to the database
    await page.locator('#db').click();

    // Handle the alert confirmation after saving
    page.once('dialog', dialog => {
      expect(dialog.message()).toBe('Trace saved successfully!');
      dialog.dismiss().catch(() => {});
    });

    await page.locator('#save-db').click();

    // 7. Verify the trace appears in the list
    const dbTraceList = page.locator('#db-trace-list');
    const newTraceInList = dbTraceList.locator('li', { hasText: 'My E2E Test Trace' });
    await expect(newTraceInList).toBeVisible();

    // 8. Delete the trace
    page.once('dialog', dialog => {
        // This is the 'Are you sure?' confirmation
        expect(dialog.type()).toBe('confirm');
        dialog.accept().catch(() => {});
    });
    page.once('dialog', dialog => {
        // This is the success alert
        expect(dialog.message()).toBe('Trace deleted successfully!');
        dialog.dismiss().catch(() => {});
    });

    await newTraceInList.locator('button', { hasText: 'Delete' }).click();

    // 9. Verify the trace is removed from the list
    await expect(newTraceInList).not.toBeVisible();
  });
});

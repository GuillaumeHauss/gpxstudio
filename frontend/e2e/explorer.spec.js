const { test, expect } = require('@playwright/test');

test.describe('File Explorer Feature', () => {
    test('should allow a user to manage folders and traces', async ({ page }) => {
        // 1. Navigate to the app
        await page.goto('http://localhost:80');

        // 2. Wait for the map to be ready
        await expect(page.locator('#mapid')).toBeVisible();
        await page.waitForLoadState('networkidle');

        // 3. Open the file explorer
        await page.locator('#open-explorer-btn').click();
        await expect(page.locator('#file-explorer')).toHaveCSS('width', '350px');

        // 4. Create a new folder
        const newFolderName = 'My Test Folder';
        page.on('dialog', async dialog => {
            if (dialog.message().includes('Enter the name for the new folder:')) {
                await dialog.accept(newFolderName);
            }
        });
        await page.locator('#add-folder-btn').click();
        await expect(page.locator('.folder-header', { hasText: newFolderName })).toBeVisible();

        // 5. Create a new trace
        await page.locator('#manual').click();
        await page.locator('#mapid').click({ position: { x: 200, y: 200 } });
        await page.locator('#mapid').click({ position: { x: 300, y: 300 } });

        // 6. Save the trace to the new folder
        const newTraceName = 'My Test Trace';
        await page.locator('#edit').click(); // Finish drawing
        page.on('dialog', async dialog => {
            if (dialog.message().includes('Enter a name for the trace:')) {
                await dialog.accept(newTraceName);
            }
        });
        await page.keyboard.press('Escape');

        const folder = page.locator('.folder-header', { hasText: newFolderName });
        await folder.locator('.fa-plus').click();

        await expect(page.locator('.trace-item', { hasText: newTraceName })).toBeVisible();

        // 7. View the trace
        await page.locator('.trace-item', { hasText: newTraceName }).locator('.fa-eye').click();
        await expect(page.locator('.tab-focus')).toContainText(newTraceName);

        // 8. Rename the folder
        const renamedFolderName = 'My Renamed Folder';
        page.on('dialog', async dialog => {
            if (dialog.message().includes('Enter the new name for the folder:')) {
                await dialog.accept(renamedFolderName);
            }
        });
        await folder.locator('.fa-edit').click();
        await expect(page.locator('.folder-header', { hasText: renamedFolderName })).toBeVisible();

        // 9. Delete the trace
        page.on('dialog', async dialog => {
            if (dialog.message().includes('Are you sure you want to delete this trace?')) {
                await dialog.accept();
            }
        });
        await page.locator('.trace-item', { hasText: newTraceName }).locator('.fa-trash').click();
        await expect(page.locator('.trace-item', { hasText: newTraceName })).not.toBeVisible();

        // 10. Delete the folder
        page.on('dialog', async dialog => {
            if (dialog.message().includes('Are you sure you want to delete this folder?')) {
                await dialog.accept();
            }
        });
        await page.locator('.folder-header', { hasText: renamedFolderName }).locator('.fa-trash').click();
        await expect(page.locator('.folder-header', { hasText: renamedFolderName })).not.toBeVisible();
    });
});

import { firefox, Page } from 'playwright';
import { serverConfig } from '../../config/server.config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { logger } from '../../lib/logger';

class PrinterScraperService {

    public async downloadMonthlyCopies(): Promise<string> {
        let browser;
        try {
            logger.info('Scraper: Launching Firefox browser...');
            browser = await firefox.launch({
                headless: serverConfig.browserHeadless,
                slowMo: serverConfig.browserSlowMo
            });
            const page = await browser.newPage();

            // Execute sequential steps as requested by the user
            await this.step0_loadPrinterPage(page);
            await this.step1_selectAdminRadio(page);
            await this.step2_submitLoginForm(page);
            await this.step3_waitForReload(page);
            await this.step4_insertPassword(page, serverConfig.printerAdminPass);
            await this.step5_clickLogin(page);
            await this.step6_waitForReload(page);
            await this.step7_clickCgiBtnOK(page);
            await this.step8_waitForReload(page);
            await this.step9_clickImportExport(page);

            await this.step10_waitForDivMain(page); // NEW: wait for div#Main

            await this.step11_selectContadorRadio(page);
            await this.step12_clickExport(page);

            await this.step13_waitForDivExport(page); // NEW: wait for div#AS_CNLExport

            await this.step14_selectContadorUsrsRadio(page);
            await this.step15_submitExport(page);
            await this.step16_waitForDescargarButton(page);
            const downloadPath = await this.step17_pressDescargarAndWait(page);
            const reportPath = await this.step18_copyToTmp(downloadPath);

            return reportPath;
        } catch (error) {
            logger.error(error, 'Scraper: Failed to download copies');
            throw error;
        } finally {
            if (browser) {
                logger.info('Scraper: Sequence finished. Closing browser.');
                await browser.close();
            }
        }
    }

    /** Helper method to deeply inject into nested iframes */
    private async waitForElementInAnyFrame(page: Page, selector: string, timeout = 10000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            // Check top level
            let el = page.locator(selector).first();
            if (await el.count() > 0) {
                logger.info({ selector }, 'Scraper: Found element in top level');
                return el;
            }

            // Check iframes
            for (const frame of page.frames()) {
                try {
                    if (frame.isDetached()) continue;
                    el = frame.locator(selector).first();
                    if (await el.count() > 0) {
                        logger.info({ selector }, 'Scraper: Found element in frame');
                        return el;
                    }
                } catch (e: any) {
                    // Ignore frame detached errors during iteration
                    if (e.message.includes('detached')) continue;
                    throw e;
                }
            }
            logger.debug({ selector, elapsed: Date.now() - startTime }, 'Scraper: Element not found yet');
            await page.waitForTimeout(200);
        }
        logger.error({ selector, timeout }, 'Scraper: Element timeout');
        throw new Error(`[Scraper] Element matching '${selector}' not found in any frame after ${timeout}ms.`);
    }

    private async step0_loadPrinterPage(page: Page) {
        logger.info('Scraper: Step 0 - Loading printer page');
        await page.goto(serverConfig.printerUrl);
    }

    private async step1_selectAdminRadio(page: Page) {
        logger.info('Scraper: Step 1 - Selecting Admin radio');
        const adminRadio = await this.waitForElementInAnyFrame(page, 'input#Admin[type="radio"][value="Admin"]:visible');
        await adminRadio.click({ force: true });
    }

    private async step2_submitLoginForm(page: Page) {
        logger.info('Scraper: Step 2 - Clicking login button');
        const submitBtn = await this.waitForElementInAnyFrame(page, 'form#LP0LOG input[type="submit"]:visible');
        await submitBtn.click({ force: true });
    }

    private async step3_waitForReload(page: Page) {
        logger.info('Scraper: Step 3 - Waiting for reload (awaiting LP1LOG form)');
        await this.waitForElementInAnyFrame(page, 'form#LP1LOG:visible');
    }

    private async step4_insertPassword(page: Page, pass: string) {
        logger.info('Scraper: Step 4 - Inserting password');
        const passInput = await this.waitForElementInAnyFrame(page, 'input#Admin_Pass:visible');
        await passInput.fill(pass);
    }

    private async step5_clickLogin(page: Page) {
        logger.info('Scraper: Step 5 - Clicking login button with password');
        const submitBtn = await this.waitForElementInAnyFrame(page, 'form#LP1LOG input#LP1_OK:visible');
        await submitBtn.click({ force: true });
    }

    private async step6_waitForReload(page: Page) {
        logger.info('Scraper: Step 6 - Waiting for post-login reload');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    }

    private async step7_clickCgiBtnOK(page: Page) {
        logger.info('Scraper: Step 7 - Clicking cgibtnOK');
        const btn = await this.waitForElementInAnyFrame(page, 'input#cgibtnOK:visible');
        await btn.click({ force: true });
    }

    private async step8_waitForReload(page: Page) {
        logger.info('Scraper: Step 8 - Waiting for reload after cgibtnOK');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
    }

    private async step9_clickImportExport(page: Page) {
        logger.info('Scraper: Step 9 - Clicking importar/exportar');
        const tab = await this.waitForElementInAnyFrame(page, 'a#ImpExp:visible');
        await tab.click({ force: true });
    }

    private async step10_waitForDivMain(page: Page) {
        logger.info('Scraper: Step 10 - Waiting for div#AS_IMP to be visible');
        await this.waitForElementInAnyFrame(page, 'div#AS_IMP[style="display: block;"]:visible');
    }

    private async step11_selectContadorRadio(page: Page) {
        logger.info('Scraper: Step 11 - Selecting contador radio');
        const radioOrLabel = await this.waitForElementInAnyFrame(page, 'input#R_SEL3:visible');
        await radioOrLabel.click({ force: true });
    }

    private async step12_clickExport(page: Page) {
        logger.info('Scraper: Step 12 - Submitting form');
        const submitBtn = await this.waitForElementInAnyFrame(page, 'input#ExportButton:visible');
        await submitBtn.click({ force: true });
        await page.waitForTimeout(2000);
    }

    private async step13_waitForDivExport(page: Page) {
        logger.info('Scraper: Step 13 - Waiting for div#AS_CNLExport to be visible');
        await this.waitForElementInAnyFrame(page, 'div#AS_CNLExport[style="display: block;"]:visible');
    }

    private async step14_selectContadorUsrsRadio(page: Page) {
        logger.info('Scraper: Step 14 - Selecting contador de usrs radio');
        const radioLabel = await this.waitForElementInAnyFrame(page, 'input#R_SEL_C2Export:visible');
        await radioLabel.click({ force: true });
    }

    private async step15_submitExport(page: Page) {
        logger.info('Scraper: Step 15 - Submit Export Form');
        const form = await this.waitForElementInAnyFrame(page, 'form#AS_CNL_EXExport:visible', 5000);
        await form.evaluate((f: any) => f.submit());
        await page.waitForTimeout(2000);
    }

    private async step16_waitForDescargarButton(page: Page) {
        logger.info('Scraper: Step 16 - Waiting for Descargar button to load');
        await this.waitForElementInAnyFrame(page, 'input#btnEXE:visible', 15000);
    }

    private async step17_pressDescargarAndWait(page: Page): Promise<string> {
        logger.info('Scraper: Step 17 - Pressing Descargar and waiting to download');
        const descargarBtn = await this.waitForElementInAnyFrame(page, 'input#btnEXE:visible', 20000);

        page.on('download', download => download.path().then(p => logger.debug({ p }, 'Scraper: File downloaded to temporary path')));
        const downloadPromise = page.waitForEvent('download');
        await descargarBtn.click({ force: true });

        const download = await downloadPromise;
        const filePath = await download.path();
        if (!filePath) {
            throw new Error('[Scraper] Download failed, path is null');
        }
        logger.info({ filePath }, 'Scraper: Successfully downloaded CSV');
        return filePath;
    }

    private async step18_copyToTmp(downloadPath: string): Promise<string> {
        logger.info('Scraper: Step 18 - Copying download to /tmp/copies_report...');
        const timestamp = new Date().getTime();
        const destPath = `/tmp/copies_report_${timestamp}.csv`;

        try {
            fs.copyFileSync(downloadPath, destPath);
            logger.info({ destPath }, 'Scraper: Successfully copied report');
            return destPath;
        } catch (err) {
            logger.error(err, 'Scraper: Failed to copy report');
            return downloadPath;
        }
    }
}

export const printerScraperService = new PrinterScraperService();

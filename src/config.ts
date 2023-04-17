import { Agent as HttpsAgent } from 'https'
import { Agent as HttpAgent } from 'http'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import puppeteer from 'puppeteer-extra'
import { executablePath } from 'puppeteer'

puppeteer.use(StealthPlugin())

export interface HLTVConfig {
  loadPage: (url: string) => Promise<string>
  httpAgent: HttpsAgent | HttpAgent
}

export const defaultLoadPage =
  (httpAgent: HttpsAgent | HttpAgent | undefined) => (url: string) =>
    new Promise<string>((resolve) => {
      puppeteer
        .launch({ headless: true, executablePath: executablePath() })
        .then(async (browser) => {
          const page = await browser.newPage()

          await page.goto(url)
          // await page.screenshot({path: 'page.png', fullPage: true})
          await page.waitForSelector('.widthControl')

          const root = await page.$eval('html', (el) => el.outerHTML)

          await page.waitForTimeout(1000)
          await browser.close()

          resolve(root)
        })
    })

const defaultAgent = new HttpsAgent()

export const defaultConfig: HLTVConfig = {
  httpAgent: defaultAgent,
  loadPage: defaultLoadPage(defaultAgent)
}

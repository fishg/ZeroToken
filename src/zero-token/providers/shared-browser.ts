/**
 * Shared browser instance manager for API calls.
 * Launches a completely separate hidden Chrome process (via Playwright)
 * so it does NOT conflict with OpenClaw's browser tool.
 *
 * OpenClaw's browser tool uses its own browser via CDP profile ports.
 * This API browser is independent — hidden, off-screen, different port.
 */
import { chromium } from "playwright-core";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { resolveZeroTokenBrowserRuntime } from "./browser-runtime.js";

let sharedBrowser: Browser | null = null;
let sharedContext: BrowserContext | null = null;
let sharedRefCount = 0;

/**
 * Get or launch a shared hidden Chrome for API calls.
 * This browser is completely separate from OpenClaw's browser tool.
 */
export async function getSharedBrowser(providerLabel: string, targetUrl: string): Promise<{
  context: BrowserContext;
  page: Page;
  isNew: boolean;
}> {
  // Check if shared browser is still connected
  if (sharedBrowser && !sharedBrowser.isConnected()) {
    console.log(`[${providerLabel}] API Chrome connection lost, resetting...`);
    sharedBrowser = null;
    sharedContext = null;
  }

  // Launch hidden Chrome if not already running
  if (!sharedBrowser) {
    const { browserConfig } = resolveZeroTokenBrowserRuntime();
    const executablePath = browserConfig.executablePath;

    console.log(`[${providerLabel}] Launching hidden API Chrome...`);

    const launchArgs = [
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-translate",
      "--hide-scrollbars",
      "--mute-audio",
      "--window-position=-32000,-32000",
      "--window-size=1,1",
    ];

    sharedBrowser = await chromium.launch({
      executablePath: executablePath || undefined,
      headless: false,
      args: launchArgs,
    });

    // Gracefully handle browser disconnect (e.g. crash)
    sharedBrowser.on("disconnected", () => {
      console.log(`[SharedBrowser] API Chrome disconnected, resetting`);
      sharedBrowser = null;
      sharedContext = null;
      sharedRefCount = 0;
    });

    sharedContext = sharedBrowser.contexts()[0] ?? await sharedBrowser.newContext();
    console.log(`[${providerLabel}] Hidden API Chrome launched`);
  } else {
    console.log(`[${providerLabel}] Reusing hidden API Chrome`);
  }

  if (!sharedContext) {
    sharedContext = await sharedBrowser.newContext();
  }

  sharedRefCount++;

  // Reuse existing page by domain, or find about:blank, or create new
  const targetDomain = new URL(targetUrl).hostname;
  const existingPage = sharedContext.pages().find((p) => {
    try { return new URL(p.url()).hostname.includes(targetDomain); } catch { return false; }
  });

  if (existingPage) {
    console.log(`[${providerLabel}] Reusing existing page for ${targetDomain}`);
    return { context: sharedContext, page: existingPage, isNew: false };
  }

  const page = sharedContext.pages().find((p) => p.url() === "about:blank") || await sharedContext.newPage();
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  return { context: sharedContext, page, isNew: true };
}

/**
 * Release a reference to the shared browser.
 * Chrome is only stopped when all providers have released.
 */
export async function releaseSharedBrowser() {
  sharedRefCount = Math.max(0, sharedRefCount - 1);
  if (sharedRefCount === 0 && sharedBrowser) {
    console.log(`[SharedBrowser] All providers released, closing API Chrome`);
    try {
      await sharedBrowser.close();
    } catch {
      // already closed
    }
    sharedBrowser = null;
    sharedContext = null;
  }
}

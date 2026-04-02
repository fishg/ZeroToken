/**
 * Shared browser instance manager.
 * All web providers share a single Chrome process to avoid port conflicts.
 */
import { chromium } from "playwright-core";
import type { Browser, BrowserContext, Page } from "playwright-core";
import { getHeadersWithAuth } from "./browser-cdp.js";
import {
  launchOpenClawChrome,
  stopOpenClawChrome,
  getChromeWebSocketUrl,
  type RunningChrome,
} from "./browser-chrome.js";
import { resolveZeroTokenBrowserRuntime } from "./browser-runtime.js";

let sharedRunning: RunningChrome | null = null;
let sharedBrowser: Browser | null = null;
let sharedRefCount = 0;

/**
 * Get or launch a shared Chrome instance.
 * Returns a BrowserContext and creates a new page navigated to the given URL.
 */
export async function getSharedBrowser(providerLabel: string, targetUrl: string): Promise<{
  context: BrowserContext;
  page: Page;
  isNew: boolean;
}> {
  const { browserConfig, profile } = resolveZeroTokenBrowserRuntime();

  // If attachOnly, connect to existing Chrome
  if (browserConfig.attachOnly) {
    console.log(`[${providerLabel}] Connecting to existing Chrome at ${profile.cdpUrl}`);

    let wsUrl: string | null = null;
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(profile.cdpUrl, 2000);
      if (wsUrl) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!wsUrl) {
      throw new Error(
        `Failed to connect to Chrome at ${profile.cdpUrl}. Make sure Chrome is running in debug mode`,
      );
    }

    const browser = await chromium.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl),
    });
    const context = browser.contexts()[0]!;

    // Try to find an existing page for this provider
    const domain = new URL(targetUrl).hostname;
    const pages = context.pages();
    let page = pages.find((p) => {
      try { return new URL(p.url()).hostname.includes(domain); } catch { return false; }
    });

    if (page) {
      console.log(`[${providerLabel}] Found existing page`);
      return { context, page, isNew: false };
    }

    console.log(`[${providerLabel}] Creating new page`);
    page = await context.newPage();
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    return { context, page, isNew: true };
  }

  // Launch shared Chrome if not already running
  if (!sharedRunning || !sharedBrowser) {
    console.log(`[${providerLabel}] Launching shared Chrome...`);
    // Keep the browser visible so OpenClaw's browser tool can reuse it.
    // Previously hidden at (-32000,-32000) with 1x1 size, but this made
    // browser tool pages invisible to the user.
    const visibleConfig = {
      ...browserConfig,
      headless: false,
      extraArgs: [
        ...(browserConfig.extraArgs || []).filter(
          (a: string) => !a.startsWith("--window-position") && !a.startsWith("--window-size")
        ),
        "--start-maximized",
      ],
    };
    sharedRunning = await launchOpenClawChrome(visibleConfig, profile);

    const cdpUrl = `http://127.0.0.1:${sharedRunning.cdpPort}`;
    let wsUrl: string | null = null;
    for (let i = 0; i < 10; i++) {
      wsUrl = await getChromeWebSocketUrl(cdpUrl, 2000);
      if (wsUrl) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!wsUrl) {
      throw new Error(`Failed to resolve Chrome WebSocket URL from ${cdpUrl}`);
    }

    sharedBrowser = await chromium.connectOverCDP(wsUrl, {
      headers: getHeadersWithAuth(wsUrl),
    });
    console.log(`[${providerLabel}] Shared Chrome launched on port ${sharedRunning.cdpPort}`);
  } else {
    console.log(`[${providerLabel}] Reusing shared Chrome on port ${sharedRunning.cdpPort}`);
  }

  sharedRefCount++;
  const context = sharedBrowser.contexts()[0]!;

  // Create a new page for this provider
  const page = context.pages().find((p) => p.url() === "about:blank") || await context.newPage();
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

  return { context, page, isNew: true };
}

/**
 * Release a reference to the shared browser.
 * Chrome is only stopped when all providers have released.
 */
export async function releaseSharedBrowser() {
  sharedRefCount = Math.max(0, sharedRefCount - 1);
  if (sharedRefCount === 0 && sharedRunning) {
    console.log(`[SharedBrowser] All providers released, stopping Chrome`);
    await stopOpenClawChrome(sharedRunning);
    sharedRunning = null;
    sharedBrowser = null;
  }
}

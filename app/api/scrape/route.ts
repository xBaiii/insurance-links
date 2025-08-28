import { NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ScrapeRequestBody = {
  baseDomain?: string;
};

function isValidBaseDomain(input: string): boolean {
  return /^[a-z0-9-]+$/.test(input);
}

function buildDealerUrl(baseDomain: string): string {
  return `https://${baseDomain}.dealer.toyota.com.au/finance/car-insurance?src=menunavigation`;
}

function buildVariantUrls(originalHref: string, newCampaign: string): string {
  try {
    const url = new URL(originalHref);
    url.searchParams.set("utm_campaign", newCampaign);
    url.searchParams.delete("utm_term");
    return url.toString();
  } catch {
    return originalHref;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ScrapeRequestBody;
  const baseDomain = (body.baseDomain || "").trim().toLowerCase();

  if (!baseDomain || !isValidBaseDomain(baseDomain)) {
    return NextResponse.json(
      {
        error:
          "Invalid base domain. Use lowercase letters, digits, and hyphens only.",
      },
      { status: 400 }
    );
  }

  const targetUrl = buildDealerUrl(baseDomain);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    });
    const page = await context.newPage();

    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });

    // Try to find the anchor by href first, then by class/text as fallback
    const candidateSelectors = [
      'a[href*="insurance.toyota.com.au/quote/quote-new"]',
      'a.button-solid[href*="insurance.toyota.com.au/quote"]',
      'a:has-text("Get a Quote")',
      'a.button-solid:has-text("Get a Quote")',
    ];

    let href: string | null = null;
    for (const selector of candidateSelectors) {
      const locator = page.locator(selector).first();
      const count = await locator.count();
      if (count > 0) {
        href = await locator.getAttribute("href");
        if (href) break;
      }
    }

    if (!href) {
      return NextResponse.json(
        {
          error: "Failed to locate the insurance quote link on the page.",
          sourceUrl: targetUrl,
        },
        { status: 404 }
      );
    }

    const serviceUrl = buildVariantUrls(href, "service_LP");
    const partsUrl = buildVariantUrls(href, "parts_LP");

    return NextResponse.json({
      sourceUrl: href,
      serviceUrl,
      partsUrl,
      dealerPage: targetUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message, dealerPage: targetUrl },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

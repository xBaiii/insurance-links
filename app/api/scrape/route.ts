import { NextResponse } from "next/server";
import { load } from "cheerio";

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

async function scrapeHrefViaHttp(targetUrl: string): Promise<string | null> {
  const res = await fetch(targetUrl, {
    method: "GET",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = load(html);

  const candidateSelectors = [
    'a[href*="insurance.toyota.com.au/quote/quote-new"]',
    'a.button-solid[href*="insurance.toyota.com.au/quote"]',
    'a:contains("Get a Quote")',
    'a.button-solid:contains("Get a Quote")',
  ];

  for (const selector of candidateSelectors) {
    const el = $(selector).first();
    if (el && el.length) {
      const rawHref = el.attr("href");
      if (rawHref) {
        try {
          const absolute = new URL(rawHref, targetUrl).toString();
          return absolute;
        } catch {
          return rawHref;
        }
      }
    }
  }
  return null;
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

  try {
    const href = await scrapeHrefViaHttp(targetUrl);

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
  }
}

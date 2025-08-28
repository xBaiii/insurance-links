# Toyota Insurance Link Generator

Simple Next.js app (Tailwind + shadcn/ui) that scrapes a Toyota dealer insurance page for the "Get a Quote" link and outputs two URLs with modified `utm_campaign` values for Service and Parts.

## How it works

1. Enter the Toyota base domain (e.g. `dubbocitytoyota`).
2. The server calls the dealer page at `https://<base>.dealer.toyota.com.au/finance/car-insurance?src=menunavigation` using Playwright.
3. It finds the quote link and returns:
   - Service URL: `utm_campaign=service_LP`
   - Parts URL: `utm_campaign=parts_LP`

## Quick start

1. Install dependencies:
   - `npm install`
   - `npx playwright install`
2. Run the dev server:
   - `npm run dev`
3. Open the app:
   - `http://localhost:3000`

## API

POST `/api/scrape`
Body: `{ "baseDomain": "dubbocitytoyota" }`
Response:

```
{
  "sourceUrl": "https://insurance.toyota.com.au/quote/quote-new?...",
  "serviceUrl": "https://insurance.toyota.com.au/quote/quote-new?...utm_campaign=service_LP",
  "partsUrl": "https://insurance.toyota.com.au/quote/quote-new?...utm_campaign=parts_LP",
  "dealerPage": "https://<base>.dealer.toyota.com.au/finance/car-insurance?src=menunavigation"
}
```

## Notes

- This uses Playwright in an API route; it may take a few seconds on first run while browsers download/launch.
- Input is validated to lowercase letters, numbers, and hyphens.

## Reference

- Dubbo City Toyota Car Insurance page used for sample link: [`https://dubbocitytoyota.dealer.toyota.com.au/finance/car-insurance?src=menunavigation`](https://dubbocitytoyota.dealer.toyota.com.au/finance/car-insurance?src=menunavigation)

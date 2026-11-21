# Shopify checkout

Branch: `shopify-checkout`. Status: building (see "Status" at the bottom, kept up to date).

## What it does

1. **In this room.** The right panel lists exactly the things that are in the room: one real Shop listing per object, the one that will be bought. No list of alternatives.
2. **Checkout.** One button creates a real Shopify checkout for those listings and shows a "Pay at ‹store›" link per merchant. Paying happens on the merchant's own checkout page, in a new tab.

## Rules from the Shopify challenge brief

These decide the design, so they are quoted here.

- "A judge must be able to make a real purchase through your project."
- "Checkouts are real. Paying on the merchant's checkout page places a real order with real money." There is no sandbox, test mode or test card.
- "Use live data. Fetch products from Shop MCP when you show them. Don't cache results or re-host merchant images."
- "Keep links exactly as returned. Product URLs and checkout links must keep every query parameter."
- "Purchases happen on the merchant's page. Create one checkout per merchant and give the shopper its `continue_url`."

From the Shop MCP docs:

- The checkout link and checkout id carry an access key. They never go into logs, files, analytics or the repo. Only the shopper sees them.
- Show the shopper every warning, every link in `links`, and the totals with their labels.
- Checkout pages cannot be put in an iframe (Shopify API terms, and the pages send `frame-ancestors 'none'`). The pay link opens in a new tab.
- Do not retry `create_checkout` in a loop.

## How it works

```
room object ──► POST /api/shop/match ──► one Product (variant_id + shop) ──► "In this room" row
                                                                                    │
"Checkout" click ──► POST /api/checkout ──► Shop MCP create_checkout, one per merchant
                                                    │
                                 "Pay at ‹store›" link = continue_url, unchanged, new tab
```

### Server (`apps/server`)

- `POST /api/shop/match` (`routes/shop.mjs`, logic in `shop.mjs`). Body `ShopMatchRequest`, answer `ShopMatchResponse`. For each room object it returns one listing that can be checked out, or `product: null` with a reason.
  - Object placed from the pre-built catalog (`catalogId`): the catalog listings are demo data and cannot be bought, so the server finds the closest real product and marks it `similar: true`.
  - Generated object (toaster, television, ...): live Shop search by the object's name.
  - No model call, no cache.
- `POST /api/checkout`. Groups items by merchant, calls `create_checkout` once per merchant, returns each merchant's `continue_url` unchanged with totals, warnings and legal links. Never logs the link.

### Front end (`apps/web`)

- `src/lib/cart.ts`: `useCart(manager)`. Reads the objects in the live scene, runs one TanStack Query per object against `/api/shop/match`, and holds the checkout state. A created checkout is dropped when the set of products changes, so a stale link is never shown.
- `src/ui/CartPanel.tsx`: the "In this room" card in the sidebar, with one Checkout button for the whole room.
- `src/ui/CartPage.tsx`: the cart page that Checkout opens (a full-screen dialog, so the room stays loaded). Listings grouped by store, each store with its totals, policy links and its own Pay link.
- About the card: It replaces the old "Shop the look" card (three web-search options per object, most of them not buyable through Shop).
- Product images load straight from the merchant. Product links and pay links are used exactly as returned.
- The old "shop the look" web search (Managed Agent) no longer starts by default. `?source=1` turns it back on.

### Contract (`apps/web/src/types.ts`)

- `ShopMatchRequest`, `ShopMatchResponse`: new.
- `CheckoutRequest.items[].store`: new, optional. The merchant's display name, echoed back.
- `CheckoutResponse.checkouts[].totals`, `.links`: new, optional.

## What a "closest match" is

Objects from the pre-built catalog are 3D models with demo listings. For those, the row and the checkout use the nearest real product on Shop and say so ("closest match"). Generated objects are matched by name only, so the listing is a real product of that kind, not a copy of the model's look.

## Testing without paying

Create a checkout, open the pay link, see the merchant page with the item and total, close the tab. No order exists until someone pays.

## Not built

- Order confirmation (polling `get_checkout` until `completed`).
- Quantity changes and removing a single row from the cart without removing the object.
- Picking a different listing for an object.

## Status

- Contract: done.
- Server match route and checkout totals: done, run against live Shop (5 objects matched in 0.6 s; a two-merchant checkout in 1.0 s returned store names, totals and legal links).
- Cart hook, panel and cart page: written, type-check and Biome pass. Used from the studio in a browser (checkouts created for 1 and for 4 stores).
- Asset library (`apps/server/library.mjs`): a model the agent builds is saved to `packages/catalog/generated/<name>.build.js` and reused for the same name with no model call.
- Known limits: catalog objects match loosely (nearest real sofa, not the same design); a generated object whose name finds nothing shows "no listing found".
- Nobody has paid on a merchant page yet (a payment is a real order).

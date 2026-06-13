# POS Module — Frontend

## What does this module do?

This is the Point of Sale screen. The cashier uses this to:
- Add products to a cart
- Hold (pause) an order and resume it later
- Complete payment in 4 ways: Cash, Online, Qarza (credit), Hybrid
- Print a receipt
- Give free food (manager approval required)
- Split a bill between multiple people

---

## Folder structure

```
POSmodule/
├── pages/
│   └── PosPage.jsx              ← Main screen. All logic lives here.
│
├── components/
│   ├── PosCartSidebar.jsx       ← Right panel: cart items, subtotal, checkout
│   ├── PosPayemntModel.jsx      ← Payment modal: cash/online/qarza/hybrid tabs
│   ├── BatchSelectionModal.jsx  ← Pick a product batch before adding to cart
│   ├── PortionModal.jsx         ← Change portion type: full / half / custom price
│   ├── FreeFoodModal.jsx        ← Manager code input for free food authorization
│   └── SplitBillModal.jsx       ← Enter person count to split the bill
│
└── services/
    └── holdOrders.service.js    ← API calls + React Query hooks for held orders
```

---

## Screen layout

```
┌─────────────────────────────────┬──────────────────────┐
│                                 │                      │
│   Product Table (left)          │   Cart Sidebar       │
│                                 │   (right)            │
│   Click any row → adds to cart  │   Items list         │
│                                 │   Subtotal           │
│                                 │   Checkout button    │
│                                 │                      │
└─────────────────────────────────┴──────────────────────┘
```

---

## How a sale works (step by step)

### 1. Cashier clicks a product row

PosPage checks:
- Does this product have a saved "sticky" batch? → use it directly
- Does this product have any batches? (API call to `/batches/product/:id`)
  - Yes → open BatchSelectionModal
  - No  → add directly with product's base price

### 2. Item appears in cart

The cart stores each item with:
- `unitPrice` — actual price after discount and portion split
- `originalPrice` — full price before any split (needed for editing later)
- `portionType` — full / half / custom
- `batchId` / `batchNumber` — which batch it came from (if any)

Clicking an item name opens **PortionModal** to change the portion type.

### 3. Cashier clicks "Proceed to Payment"

PaymentModal opens with 4 tabs:
- **Cash** — enter amount received, shows change automatically
- **Online** — pick platform (Easypaisa, JazzCash, etc.) and enter amount
- **Qarza** — pick a credit account from the dropdown
- **Hybrid** — split between cash and qarza, both must total the order amount

### 4. Hold Order (optional)

If the cashier needs to pause, they click "Hold Order" in the payment modal.
- The cart is saved to `/api/hold-orders` in the database
- The cart is cleared on screen
- Later: open "Held Orders" panel → click resume → items return to cart
- The held order stays in DB until the order is successfully completed

### 5. Complete Payment

Clicking "Complete Payment":
1. Sends order to `/api/orders` → saved permanently
2. If the cart was resumed from a hold → deletes that hold from `/api/hold-orders`
3. Prints the receipt
4. Clears the cart

---

## Files explained

### `PosPage.jsx`
The brain of the module. Contains:
- All state (cart, modals, batch selections, held order tracking)
- All handlers (add to cart, checkout, hold, resume, free food, split bill)
- Renders the product table and passes everything to child components

The logic is organized into 8 numbered sections with clear section headers.

### `PosCartSidebar.jsx`
Shows the current cart on the right side of the screen.
- Each cart item has +/− buttons and a qty input
- Clicking the item name opens PortionModal
- Bottom shows subtotal and the checkout button
- Slide-out drawer shows Held Orders and Order History tabs

### `PosPayemntModel.jsx`
The payment form. Validates each tab before enabling the "Complete Payment" button:
- Cash: received amount must be ≥ total
- Online: platform selected + amount ≥ total
- Qarza: a credit account must be selected
- Hybrid: both amounts must exactly sum to the total

### `BatchSelectionModal.jsx`
Lists all batches for a product, sorted by expiry date (soonest first).
Highlights out-of-stock and near-expiry batches.
Has a "Save as default" checkbox to skip this modal next time.

### `PortionModal.jsx`
Three buttons: Full / Half / Custom price.
Custom shows a text input. Press Enter or click "Update Cart" to apply.

### `FreeFoodModal.jsx`
Password input for manager code.
The code is verified by the backend — not the frontend.

### `SplitBillModal.jsx`
Number input for how many people are splitting.
PosPage opens a print window showing each person's share.

### `holdOrders.service.js`
Three React Query hooks:
- `useHoldOrders()` — fetches all held orders (auto-cached)
- `useCreateHoldOrder()` — saves a new held order
- `useDeleteHoldOrder()` — deletes a held order

---

## Important design decisions

**Hold ≠ Order**
Held orders are stored in a separate DB collection (`HoldOrders`), not mixed
with completed orders. This keeps the orders list clean.

**Resume does not delete the hold**
When you resume a held order, the hold stays in the DB. It is only deleted
after checkout succeeds. This prevents data loss if the page refreshes.

**No batches = no popup**
Before showing the batch selection modal, PosPage checks if the product
actually has batches. If zero batches → adds directly. No unnecessary clicks.

**Sticky batches**
If a cashier picks a batch and ticks "Save as default", that batch is reused
automatically on every subsequent click of the same product — until the page
is refreshed or the default is cleared.

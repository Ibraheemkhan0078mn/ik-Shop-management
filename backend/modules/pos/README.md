# POS Module — Backend

## What does this module do?

This module handles everything that happens at the Point of Sale counter.
There are two main concepts here: **Orders** and **Held Orders**.

---

## Orders  (`/api/orders`)

An order is a completed sale. When a customer buys something and pays,
an order is created and permanently saved.

### Files

| File | What it does |
|------|--------------|
| `models/order.model.js`          | Defines what an order looks like in the database (items, price, payment, etc.) |
| `schemas/order.schema.js`        | Validates the data before saving (uses Yup) |
| `controllers/order.controller.js` | Contains the actual logic for each API action |
| `routes/order.router.js`          | Maps HTTP requests (GET, POST, DELETE) to controller functions |

### API Routes

| Method | URL                        | Who can use it       | What it does |
|--------|----------------------------|----------------------|--------------|
| GET    | `/api/orders/generate-number` | All logged-in users  | Returns a fresh unique order number like `ORD-20250613-0001` |
| GET    | `/api/orders`              | All logged-in users  | Returns all completed orders, newest first |
| POST   | `/api/orders`              | Admin + Staff        | Creates a new completed order |
| DELETE | `/api/orders/:id`          | Admin only           | Permanently deletes an order |

### Order fields explained

- `orderNumber` — unique ID like ORD-20250613-0001
- `subtotal` — sum of all items before discount
- `discountAmount` — amount subtracted
- `totalAmount` — final amount customer pays
- `items` — list of products sold (quantity, unit price, batch info)
- `paymentMethod` — cash / online / credit (qarza) / hybrid / free
- `cashReceived` / `change` — for cash payments
- `onlinePlatform` / `onlineAmount` — for online payments (Easypaisa, JazzCash, etc.)
- `qarzaAccount` — linked account for credit sales
- `hybridCash` / `hybridQarza` / `hybridQarzaAccount` — for split cash+credit payments
- `status` — completed or cancelled

---

## Held Orders  (`/api/hold-orders`)

A held order is a paused order. When the cashier needs to serve another
customer first, they can "hold" the current cart. The items are saved here.

When they resume it later, the items load back into the cart.
When the order is finally completed (checked out), the held order is
**automatically deleted** — it was just temporary storage.

### Files

| File | What it does |
|------|--------------|
| `models/holdOrder.model.js`          | Defines what a held order looks like in the database |
| `controllers/holdOrder.controller.js` | Logic for get / create / delete |
| `routes/holdOrder.router.js`          | Maps HTTP requests to controller functions |

### API Routes

| Method | URL                   | Who can use it       | What it does |
|--------|-----------------------|----------------------|--------------|
| GET    | `/api/hold-orders`    | All logged-in users  | Returns all currently held orders |
| POST   | `/api/hold-orders`    | Admin + Staff        | Saves a new held order |
| DELETE | `/api/hold-orders/:id` | Admin + Staff       | Deletes a held order (manual delete OR auto-delete after checkout) |

---

## How to add this module to the server

These two lines are already in `backend/index.js`:

```js
import OrderRouter     from "./modules/pos/routes/order.router.js";
import HoldOrderRouter from "./modules/pos/routes/holdOrder.router.js";

app.use("/api/orders",      OrderRouter);
app.use("/api/hold-orders", HoldOrderRouter);
```

And the models are registered in `backend/configs/connect.db.js` as
`OrderModel` and `HoldOrderModel`.

---

## Flow summary

```
Customer selects products
        ↓
Cashier clicks "Proceed to Payment"
        ↓
  ┌─────────────────────────────┐
  │  Need to pause?             │
  │  → POST /hold-orders        │  ← cart saved, cashier serves next customer
  │  → Resume later             │  ← items loaded back into cart from hold
  └─────────────────────────────┘
        ↓
Cashier completes payment
        ↓
  POST /orders                  ← completed order saved permanently
        ↓
  DELETE /hold-orders/:id       ← held order deleted (if order was resumed)
        ↓
  Receipt printed
```

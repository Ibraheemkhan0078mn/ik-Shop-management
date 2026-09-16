# Purchase Flow Contract

## Scope
This document defines the current purchase invoice contract before cleanup. It is the feature checklist for the purchase CRUD flow.

## Item calculation
1. `quantity * costPrice` is the item base total.
2. Discount is entered as percentage or fixed amount and may apply to the entire calculation or per unit.
3. Tax is entered as percentage or fixed amount and applies after discount, with the same scope choices.
4. Fixed per-unit values are multiplied by quantity; fixed entire values are used once.
5. The frontend calculates discount amount, amount after discount, tax amount, final item total, effective per-unit costing, and final total costing.
6. Fixed values are converted to equivalent percentages before the purchase payload is sent. The backend and batch metadata receive percentage rates.
7. Existing percentage calculations remain unchanged.

## Stored purchase item values
Each purchase item stores product, batch, quantity, selling price (`price`), base unit cost (`costPrice`), normalized percentage discount and tax, original input type/value, calculation scope (`entire` or `perUnit`), dates, effective per-unit costing, and final item costing.

## Batch values
A batch stores its `originPurchaseId`, base purchase price, selling price, normalized percentage discount and tax, original input type/value, calculation scope (`entire` or `perUnit`), and effective per-unit costing. Batch quantity remains controlled by purchase status delivery logic.

## Invoice flow
- Create: frontend calculates and sends the complete invoice payload; backend persists the invoice and batch metadata.
- Update: backend preserves delivered-stock adjustment and supplier-credit synchronization; frontend sends the same normalized item contract.
- Batch edit: `GET /purchases/:purchaseId/batch-usage/:batchId` reports origin and purchase reuse. A batch is editable only when its origin is the current purchase and it is not referenced by another purchase; the backend enforces this rule.
- Delete: backend preserves delivered-stock reversal and transaction cleanup.
- Read/list/detail/PDF: consumers read the stored item costing and fall back to the existing calculation only for legacy records.
- Purchase return: per-unit values use stored item costing when present, with legacy fallback retained.

## Cleanup boundaries
- Keep payment, status, stock, supplier-credit, batch-number, and purchase-return behavior unchanged.
- Remove dead commented purchase controller code, debug logging, unused imports/state, and repeated local mapping only where behavior is preserved.
- Keep one purchase domain service for purchase CRUD orchestration; the centralized database CRUD helper remains the persistence boundary.
- Do not remove fields that are used by payments, status, returns, reports, sync, or invoice rendering.

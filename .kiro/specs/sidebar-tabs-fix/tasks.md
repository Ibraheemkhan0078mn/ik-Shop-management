# Implementation Plan: sidebar-tabs-fix

## Overview

A single-file change to `frontend/src/common/data/sidebar.js` that promotes four purchase-related pages from a nested sub-menu to individual top-level sidebar entries, removes the old parent group, and updates the `lucide-react` icon imports accordingly.

## Tasks

- [ ] 1. Update `sidebar.js` — icons, entries, and structure
  - [ ] 1.1 Update the `lucide-react` import block
    - Remove `CreditCard` from the import list
    - Add `ShoppingBag`, `RotateCcw`, `Trash2`, `Truck` to the import list
    - _Requirements: 3.1_

  - [ ] 1.2 Replace the Purchases group with four flat top-level entries
    - Delete the existing `Purchases` object (with its `items[]` array) from `navMain`
    - Insert four new entry objects in its place, in order:
      - `{ id: "Product Purchases", title: "Product Purchases", url: "/purchases", icon: ShoppingBag, allowedUrls: ["/purchases"] }`
      - `{ id: "Returns", title: "Returns", url: "/returns", icon: RotateCcw, allowedUrls: ["/returns"] }`
      - `{ id: "Wastage", title: "Wastage", url: "/wastage", icon: Trash2, allowedUrls: ["/wastage"] }`
      - `{ id: "Suppliers", title: "Suppliers", url: "/suppliers", icon: Truck, allowedUrls: ["/suppliers"] }`
    - None of the four objects should include an `items` property
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.3_

  - [ ]* 1.3 Write property tests for `sidebarData()`
    - **Property 1: Four purchase entries present in navMain** — for any language value, `navMain` contains entries with ids `"Product Purchases"`, `"Returns"`, `"Wastage"`, `"Suppliers"`, each with the matching `url` and single-element `allowedUrls`
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
    - **Property 2: Purchases parent group is absent** — for any language value, `navMain` contains no entry with `id === "Purchases"`
    - **Validates: Requirements 1.5**
    - **Property 3: No sub-items on the four purchase entries** — for any language value, each of the four new entries has a falsy/absent `items` property
    - **Validates: Requirements 3.3**
    - **Property 4: Active-highlight maps each route to exactly one entry** — for each route in `["/purchases", "/returns", "/wastage", "/suppliers"]`, `getActiveParentId()` returns the corresponding entry id and no other purchase-related id
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [ ] 2. Checkpoint — verify the sidebar renders correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster delivery
- The entire change is scoped to a single file (`frontend/src/common/data/sidebar.js`) — no routing, page components, or `SideBar.jsx` require modification
- The active-highlight logic in `SideBar.jsx` already handles flat entries correctly; no changes needed there
- Property tests should use a property-based testing library already present in the project (e.g., fast-check) or a simple loop over representative inputs if no PBT library is available

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] }
  ]
}
```

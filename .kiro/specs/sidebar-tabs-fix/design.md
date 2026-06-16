# Design Document — sidebar-tabs-fix

## Overview

This fix promotes four purchase-related pages from a collapsible sub-menu under a single "Purchases" parent entry to individual, flat top-level sidebar entries. The change is scoped entirely to `frontend/src/common/data/sidebar.js`. No routing, page components, or the `SideBar.jsx` renderer need modification.

---

## Architecture

### Component Relationships

```
SideBar.jsx (no changes)
  └── sidebarData(language)          ← only file that changes
        └── navMain[]
              ├── Dashboard
              ├── Sale (POS)
              ├── Stock & Expenses (Products)
              ├── [REMOVED] Purchases (parent group with items[])
              ├── [NEW] Product Purchases   ← top-level, no items
              ├── [NEW] Returns             ← top-level, no items
              ├── [NEW] Wastage             ← top-level, no items
              ├── [NEW] Suppliers           ← top-level, no items
              ├── Reports
              ├── Credit & Debits
              ├── Investors
              ├── Members
              └── Expenses
```

The `SideBar.jsx` renderer already handles flat top-level entries correctly:
- It renders a `<NavLink to={item.url}>` for every item in `navMain`.
- It only renders a sub-list when `item.items?.length > 0`; with no `items` property the sub-list branch is simply skipped.
- `getActiveParentId()` already walks `navMain` and checks `item.allowedUrls` — so the four new entries will receive correct active highlighting without any changes to the component.

---

## Data Model

### Sidebar Entry Shape

```typescript
interface SidebarEntry {
  id: string;          // unique key, also used by getActiveParentId
  title: string;       // display label (may be language-dependent)
  url: string;         // NavLink destination; first navigation target
  icon: LucideIcon;    // icon component from lucide-react
  allowedUrls: string[]; // url prefixes that activate this entry
  permissions?: string;  // optional permission key for canAccess()
  // items?: never      // intentionally omitted — no sub-tabs
}
```

### The Four New Entries

| id | title | url | icon | allowedUrls |
|----|-------|-----|------|-------------|
| `"Product Purchases"` | `"Product Purchases"` | `"/purchases"` | `ShoppingBag` | `["/purchases"]` |
| `"Returns"` | `"Returns"` | `"/returns"` | `RotateCcw` | `["/returns"]` |
| `"Wastage"` | `"Wastage"` | `"/wastage"` | `Trash2` | `["/wastage"]` |
| `"Suppliers"` | `"Suppliers"` | `"/suppliers"` | `Truck` | `["/suppliers"]` |

> Icons are chosen from `lucide-react` to semantically match each domain. The existing `CreditCard` icon (used by the removed parent group) is no longer needed and can be removed from the import list.

---

## Implementation

### Changes to `frontend/src/common/data/sidebar.js`

1. **Remove** the `Purchases` group object (the entry with `id: "Purchases"`, `items: [...]`).
2. **Add** four new top-level entry objects in the same position in `navMain`.
3. **Update** the `lucide-react` import to remove `CreditCard` and add `ShoppingBag`, `RotateCcw`, `Trash2`, `Truck`.

#### Resulting `sidebarData()` excerpt (after the fix)

```js
import {
    BarChart3,
    Wallet,
    ShoppingCart,
    Users,
    DollarSign,
    Package,
    TrendingUp,
    ShoppingBag,   // Product Purchases
    RotateCcw,     // Returns
    Trash2,        // Wastage
    Truck,         // Suppliers
} from "lucide-react";

// ... inside navMain array, replacing the Purchases group:

{
    id: "Product Purchases",
    title: "Product Purchases",
    url: "/purchases",
    icon: ShoppingBag,
    allowedUrls: ["/purchases"],
},
{
    id: "Returns",
    title: "Returns",
    url: "/returns",
    icon: RotateCcw,
    allowedUrls: ["/returns"],
},
{
    id: "Wastage",
    title: "Wastage",
    url: "/wastage",
    icon: Trash2,
    allowedUrls: ["/wastage"],
},
{
    id: "Suppliers",
    title: "Suppliers",
    url: "/suppliers",
    icon: Truck,
    allowedUrls: ["/suppliers"],
},
```

No other files are modified.

---

## Active-Highlight Logic (No Changes Required)

`getActiveParentId()` in `SideBar.jsx` already works correctly for the new shape:

```js
const getActiveParentId = () => {
    const current = sidebarList.navMain.find((item) => {
        if (item.id === "Dashboard") return location.pathname === "/";
        return item.allowedUrls?.some((url) =>
            location.pathname.startsWith(url)
        );
    });
    return current?.id || "/";
};
```

With the four new entries each having a single-element `allowedUrls`, exactly one entry will match for each of the four routes, and none of the other purchase-related entries will match.

---

## Error Handling

There are no new error paths introduced. The data function is pure and synchronous. The only possible failure mode — an icon name not exported by `lucide-react` — is caught at build time by the bundler.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Four purchase entries present in navMain

*For any* language string passed to `sidebarData()`, the returned `navMain` array SHALL contain exactly the four entries with ids `"Product Purchases"`, `"Returns"`, `"Wastage"`, and `"Suppliers"`, each with the matching `url` and a single-element `allowedUrls` array equal to that `url`.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Purchases parent group is absent

*For any* language string passed to `sidebarData()`, the returned `navMain` array SHALL NOT contain any entry with `id === "Purchases"`.

**Validates: Requirements 1.5**

### Property 3: No sub-items on the four purchase entries

*For any* language string passed to `sidebarData()`, each of the four purchase-related top-level entries SHALL NOT have a truthy `items` property, ensuring the sidebar renderer never produces a nested sub-list for them.

**Validates: Requirements 3.3**

### Property 4: Active-highlight maps each route to exactly one entry

*For any* route in `{ "/purchases", "/returns", "/wastage", "/suppliers" }`, when `getActiveParentId()` is evaluated against that route using the `navMain` produced by `sidebarData()`, it SHALL return the corresponding entry id and SHALL NOT return the id of any other purchase-related entry.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

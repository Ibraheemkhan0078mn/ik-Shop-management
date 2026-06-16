# Requirements Document

## Introduction

The sidebar currently nests four purchase-related pages (Product Purchases, Returns, Wastage, Suppliers) as collapsible sub-items under a single "Purchases" parent entry in `frontend/src/common/data/sidebar.js`. This causes an extra click to reach any of the four pages and introduces an unnecessary grouping layer. The fix promotes each of the four pages to a standalone top-level sidebar entry, removes the "Purchases" parent group entirely, and ensures the active-highlight logic works correctly for each entry — all without touching routing or individual page components.

## Glossary

- **Sidebar**: The left-side navigation panel rendered by `frontend/src/common/components/SideBar.jsx`.
- **SidebarData**: The `sidebarData()` function in `frontend/src/common/data/sidebar.js` that returns the `navMain` array consumed by the Sidebar.
- **Top-level entry**: An object in the `navMain` array that is rendered directly as a `<NavLink>` in the sidebar without indentation or parent grouping.
- **Purchases group**: The existing sidebar object with `id: "Purchases"` that contains `items[]` with the four sub-tabs.
- **allowedUrls**: The array of URL prefixes on a sidebar entry used by `getActiveParentId()` to determine which entry should appear highlighted for a given route.
- **Active highlight**: The `sidebar-item-active` CSS class applied to a sidebar entry when the current route matches the entry's `url` or any value in `allowedUrls`.

## Requirements

### Requirement 1

**User Story:** As a user, I want each of the four purchase-related pages to appear directly in the main sidebar, so that I can navigate to any of them with a single click without expanding a group.

#### Acceptance Criteria

1. THE SidebarData SHALL contain a top-level entry with `id: "Product Purchases"`, `url: "/purchases"`, and `allowedUrls: ["/purchases"]`.
2. THE SidebarData SHALL contain a top-level entry with `id: "Returns"`, `url: "/returns"`, and `allowedUrls: ["/returns"]`.
3. THE SidebarData SHALL contain a top-level entry with `id: "Wastage"`, `url: "/wastage"`, and `allowedUrls: ["/wastage"]`.
4. THE SidebarData SHALL contain a top-level entry with `id: "Suppliers"`, `url: "/suppliers"`, and `allowedUrls: ["/suppliers"]`.
5. THE SidebarData SHALL NOT contain any entry with `id: "Purchases"` in the `navMain` array.

### Requirement 2

**User Story:** As a user, I want the correct sidebar entry to be highlighted when I am on any of the four purchase-related routes, so that I always know which section I am in.

#### Acceptance Criteria

1. WHEN the current route is `/purchases`, THE Sidebar SHALL apply the active highlight to the "Product Purchases" entry and to no other purchase-related entry.
2. WHEN the current route is `/returns`, THE Sidebar SHALL apply the active highlight to the "Returns" entry and to no other purchase-related entry.
3. WHEN the current route is `/wastage`, THE Sidebar SHALL apply the active highlight to the "Wastage" entry and to no other purchase-related entry.
4. WHEN the current route is `/suppliers`, THE Sidebar SHALL apply the active highlight to the "Suppliers" entry and to no other purchase-related entry.

### Requirement 3

**User Story:** As a developer, I want the sidebar fix to be scoped to sidebar data only, so that no unintended side effects occur in routing or page components.

#### Acceptance Criteria

1. THE fix SHALL be applied exclusively within `frontend/src/common/data/sidebar.js`.
2. THE SidebarData function SHALL NOT modify `frontend/src/App.jsx`, `AppRoutes.jsx`, or any individual page component file.
3. THE four new top-level entries SHALL NOT include an `items` property, ensuring no sub-tab nesting is introduced.

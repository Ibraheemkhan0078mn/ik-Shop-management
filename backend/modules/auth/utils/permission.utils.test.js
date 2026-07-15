import { normalizePermissions } from './permission.utils.js';

describe('normalizePermissions', () => {
  it('converts legacy object permissions into dot-notation strings', () => {
    const result = normalizePermissions({
      dashboard: true,
      products: true,
      manageUsers: true,
    });

    expect(result).toEqual(expect.arrayContaining(['dashboard.view', 'products.view', 'users.manage']));
  });

  it('preserves an existing string-array permission list', () => {
    const result = normalizePermissions(['products.view', 'purchases.create']);

    expect(result).toEqual(['products.view', 'purchases.create']);
  });
});

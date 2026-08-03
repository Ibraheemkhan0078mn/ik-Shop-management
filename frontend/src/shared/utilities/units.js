// ─── Simple Units Array ──────────────────────────────────────────────
const UNITS = [
  // Weight
  { value: 'mg', label: 'Milligram (mg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'mcg', label: 'Microgram (mcg)' },
  
  // Volume
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'L', label: 'Liter (L)' },
  
  // Count
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'box', label: 'Box' },
  { value: 'strip', label: 'Strip' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'pack', label: 'Pack' },
  { value: 'carton', label: 'Carton' },
  { value: 'vial', label: 'Vial' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'injection', label: 'Injection' },
  { value: 'sachet', label: 'Sachet' },
];

// ─── Unit Categories for Filtering ──────────────────────────────────
const UNIT_CATEGORIES = {
  weight: ['mg', 'g', 'kg', 'mcg'],
  volume: ['ml', 'L'],
  count: ['pcs', 'box', 'strip', 'bottle', 'pack', 'carton', 'vial', 'tablet', 'capsule', 'injection', 'sachet']
};

// ─── Helper Functions ────────────────────────────────────────────────

// Get unit label
const getUnitLabel = (value) => {
  const unit = UNITS.find(u => u.value === value);
  return unit ? unit.label : value;
};

// Get units by category
const getUnitsByCategory = (category) => {
  const values = UNIT_CATEGORIES[category] || [];
  return UNITS.filter(u => values.includes(u.value));
};

// Simple conversion (just weight and volume)
const convertUnit = (value, from, to) => {
  // Weight conversions (to mg)
  const weightToMg = { mg: 1, g: 1000, kg: 1000000, mcg: 0.001 };
  
  // Volume conversions (to ml)
  const volumeToMl = { ml: 1, L: 1000 };
  
  // Check if both are weight units
  if (weightToMg[from] && weightToMg[to]) {
    const inMg = value * weightToMg[from];
    return inMg / weightToMg[to];
  }
  
  // Check if both are volume units
  if (volumeToMl[from] && volumeToMl[to]) {
    const inMl = value * volumeToMl[from];
    return inMl / volumeToMl[to];
  }
  
  // Can't convert between different types
  return null;
};

export { UNITS, UNIT_CATEGORIES, getUnitLabel, getUnitsByCategory, convertUnit };
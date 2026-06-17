// Conversion reference
const unitConversions = {
  kg: { base: "g", factor: 1000 },
  g: { base: "g", factor: 1 },
  L: { base: "ml", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  // piece: { base: "piece", factor: 1 },
  // pack: { base: "piece", factor: 1 },
  dozen: { base: "piece", factor: 12 },
  box: { base: "piece", factor: 1 },
  cup: { base: "ml", factor: 240 },
  // tsp: { base: "ml", factor: 5 },
  // tbsp: { base: "ml", factor: 15 },
  // bottle: { base: "ml", factor: 500 },
  // can: { base: "ml", factor: 330 },
  // jar: { base: "ml", factor: 250 },
  // bag: { base: "kg", factor: 1 },
  // tray: { base: "piece", factor: 30 },
  // bundle: { base: "piece", factor: 10 },
  // slice: { base: "piece", factor: 1 },
  // serving: { base: "piece", factor: 1 },
  // cupcake: { base: "piece", factor: 1 },
  plate: { base: "piece", factor: 1 },
};

// Conversion function
export function convertUnit(quantity, fromUnit, toUnit) {
  const from = unitConversions[fromUnit];
  const to = unitConversions[toUnit];

  if (!from) throw new Error(`Unknown unit: ${fromUnit}`);
  if (!to) throw new Error(`Unknown unit: ${toUnit}`);
  if (from.base !== to.base)
    throw new Error(`Incompatible units: ${fromUnit} → ${toUnit}`);

  // Convert quantity to base unit first, then to target unit
  const quantityInBase = quantity * from.factor;
  const convertedQuantity = quantityInBase / to.factor;

  return convertedQuantity;
}

export function getBaseUnit(unit) {
  const meta = unitConversions[unit];
  if (!meta) throw new Error(`Unknown unit: ${unit}`);
  return meta.base;
}

export const UNITS_MAP = unitConversions;



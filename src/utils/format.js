export const fmt = (n) => {
  const val = (n || 0) / 100000;
  return `₹${val.toFixed(2)}L`;
};

export const fmtCompact = (n) => {
  const val = (n || 0) / 100000;
  if (val >= 100) return `₹${(val / 100).toFixed(1)}Cr`;
  return `₹${val.toFixed(1)}L`;
};

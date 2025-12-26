// Safe floor function to handle floating point precision issues
export const trunc = (v: number) => Math.floor(v + 1e-10);

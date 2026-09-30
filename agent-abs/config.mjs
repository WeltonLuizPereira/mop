export function normalizeSupabaseUrl(value) {
  const url = new URL(value);
  return url.origin;
}

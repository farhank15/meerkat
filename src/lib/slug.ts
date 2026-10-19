/** Stable anchor id for a testcase name — same rule the coverage table used. */
export function slugifyTestName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

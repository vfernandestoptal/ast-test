export function unquote(value: string): string {
  return value.replace(/(^["|'|`]|["|'|`]$)/g, "");
}
export function convertUrlParametersToCurlyBraces(url: string) {
  return url.replace(/:(.+?)(\/|$)/g, "{$1}$2");
}

/** An estimate that accounts for Chinese characters and space-separated words. */
export function readingMinutes(body = ''): number {
  const text = body.replace(/```[\s\S]*?```/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  const characters = (text.match(/\p{Script=Han}/gu) ?? []).length;
  const words = (text.replace(/\p{Script=Han}/gu, ' ').match(/[\p{L}\p{N}]+/gu) ?? []).length;
  return Math.max(1, Math.ceil(characters / 350 + words / 200));
}

export function postUrl(id: string): string {
  return '/blog/' + id.split('/').map(encodeURIComponent).join('/') + '/';
}

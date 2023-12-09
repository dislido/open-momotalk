const finalizationRegistry = new FinalizationRegistry<string>((url) => {
  URL.revokeObjectURL(url);
});

/** 获取blob的url, 此url会随第二个返回值的gc而自动revoke */
export function createAutoRevokeableObjectUrl(blob: Blob | MediaSource) {
  const GCrefence = { blob };
  const url = URL.createObjectURL(blob);
  finalizationRegistry.register(GCrefence, url);
  return [url, GCrefence] as const;
}

export async function runReconciledMutation({
  mutate,
  reconcile,
  maxAttempts = 2,
}) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await mutate();
    } catch (error) {
      lastError = error;

      const persistedResult = await reconcile();
      if (persistedResult !== null && persistedResult !== undefined) {
        return persistedResult;
      }
    }
  }

  throw lastError;
}

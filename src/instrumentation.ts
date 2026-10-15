/**
 * Starts the translation worker inside the web process (one process, no extra service).
 * Every few seconds it asks Payload to run queued `translation` jobs; failures are retried with
 * exponential backoff by the task definition. Disable with PAYLOAD_DISABLE_AUTORUN=1.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (process.env.PAYLOAD_DISABLE_AUTORUN === '1') return;
  const g = globalThis as { __hcWorker?: NodeJS.Timeout };
  if (g.__hcWorker) return;

  let busy = false;
  g.__hcWorker = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      const { getPayloadClient } = await import('./lib/runtime.ts');
      const { appConfig } = await import('./lib/runtime-light.ts');
      if (appConfig().translation.provider === 'none') return;
      const payload = await getPayloadClient();
      await payload.jobs.run({ queue: 'translation', limit: appConfig().translation.concurrency, silent: true });
    } catch (err) {
      console.error('[translation-worker]', (err as Error).message);
    } finally {
      busy = false;
    }
  }, 4000);
  g.__hcWorker.unref?.();
}

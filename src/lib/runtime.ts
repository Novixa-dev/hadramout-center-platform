import { getPayload, type Payload } from 'payload';
import config from '@payload-config';

/** The Payload client (Payload caches the instance itself, also across Next.js hot reloads). */
export async function getPayloadClient(): Promise<Payload> {
  return getPayload({ config });
}

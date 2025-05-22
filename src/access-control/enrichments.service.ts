import { Injectable } from '@nestjs/common';
import { EnrichmentsStore } from './enrichments.store';

/**
 * @publicApi
 */
@Injectable()
export class EnrichmentsService {
  constructor() {}

  setEnrichment(schemaName: string, key: string, value: unknown) {
    const store = EnrichmentsStore.getContext();
    if (!store) {
      throw new Error('Enrichments store is not initialized');
    }

    store[schemaName] = store[schemaName] || {};
    store[schemaName][key] = value;
    EnrichmentsStore.updateContext(store);
  }

  setGlobalEnrichment(key: string, value: unknown) {
    const store = EnrichmentsStore.getContext();
    if (!store) {
      throw new Error('Enrichments store not found');
    }

    store['global'] = store['global'] || {};
    store.global[key] = value;
    EnrichmentsStore.updateContext(store);
  }

  getEnrichment(schemaName: string, key: string): unknown {
    const store = EnrichmentsStore.getContext();
    if (!store) {
      throw new Error('Enrichments store not found');
    }

    return store[schemaName]?.[key] || store.global[key];
  }
}

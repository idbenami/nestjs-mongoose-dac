import { AsyncLocalStorage } from 'async_hooks';
import { SchemaFieldType } from '../common/types';

type EnrichmentsStoreType = {
  [key: string]: {
    [key: string]: SchemaFieldType;
  };
};
const enrichmentsStore = new AsyncLocalStorage<EnrichmentsStoreType>();

export const EnrichmentsStore = {
  getContext(): EnrichmentsStoreType {
    const context = enrichmentsStore.getStore();
    if (!context) {
      return {};
    }
    return context;
  },

  updateContext(obj: EnrichmentsStoreType): void {
    const context = enrichmentsStore.getStore();
    if (context) {
      Object.assign(context, obj);
    }
  },
};

export const runWithCtx = (
  nextFn: (ctx: Record<string, any>) => any,
  context: Record<string, any> = {},
) => {
  return enrichmentsStore.run(context, () => {
    return nextFn(context);
  });
};

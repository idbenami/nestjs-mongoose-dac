import { AsyncLocalStorage } from 'async_hooks';

const enrichmentsStore = new AsyncLocalStorage<Record<string, any>>();

export const EnrichmentsStore = {
  getContext(): Record<string, any> {
    const context = enrichmentsStore.getStore();
    if (!context) {
      return {};
    }
    return { ...context };
  },

  updateContext(obj: Record<string, any>): void {
    const context = enrichmentsStore.getStore();
    if (context) {
      Object.assign(context, obj);
    }
  },
};

export const runWithCtx = (
  fx: (ctx: Record<string, any>) => any,
  context: Record<string, any> = {},
) => {
  return enrichmentsStore.run(context, () => {
    return fx(context);
  });
};

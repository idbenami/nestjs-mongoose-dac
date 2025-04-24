import { Schema, Document } from 'mongoose';

export const DAC_RULES_KEY = '__dacRules';

export interface AccessPolicy<T = any> {
  rule: (
    getEnrichment: (key: string) => any,
  ) => Partial<Record<keyof Omit<T, keyof Document>, any>>;
}

export interface DACRules {
  [key: string]: AccessPolicy;
}

export function defineAccessPolicy<T>(schema: Schema, key: string, policy: AccessPolicy<T>) {
  const existingRules = (DAC_RULES_KEY in schema ? (schema as any)[DAC_RULES_KEY] : {}) as DACRules;

  schema.statics[DAC_RULES_KEY] = function () {
    return { ...existingRules, [key]: policy };
  };
}

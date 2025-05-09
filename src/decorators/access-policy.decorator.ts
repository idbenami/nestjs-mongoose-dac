import { Schema, Document } from 'mongoose';

export const DAC_RULES_PREFIX = '__dacRules_';

export type AccessPolicyRuleType = 'query' | 'count' | 'update' | 'delete' | 'save';

export interface AccessPolicyRule<T = any> {
  type: AccessPolicyRuleType | AccessPolicyRuleType[];
  rule: (get: (key: string) => any) => Partial<Record<keyof Omit<T, keyof Document>, any>>;
}

export interface DACRules {
  [key: string]: AccessPolicyRule;
}

export function defineAccessPolicy<T>(schema: Schema, key: string, policy: AccessPolicyRule<T>) {
  schema.statics[`${DAC_RULES_PREFIX}${key}`] = function () {
    return policy;
  };
}

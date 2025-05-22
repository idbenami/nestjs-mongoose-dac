import { Schema, Document } from 'mongoose';

export const DAC_RULES_PREFIX = '__dacRules_';

/**
 * @publicApi
 */
export type AccessPolicyRuleType = 'query' | 'count' | 'update' | 'delete' | 'save';

/**
 * @publicApi
 */
export interface AccessPolicyRule<T = any> {
  type: AccessPolicyRuleType | AccessPolicyRuleType[];
  rule: (get: (key: string) => any) => Partial<Record<keyof Omit<T, keyof Document>, any>>;
}

export interface DACRules {
  [key: string]: AccessPolicyRule;
}

/**
 * Defines a rule to enforce access control policies on a schema.
 * @param schema a Mongoose schema
 * @param key the name of the rule
 * @param policy the access policy rule
 * @publicApi
 */
export function defineRule<T>(schema: Schema, key: string, policy: AccessPolicyRule<T>) {
  schema.statics[`${DAC_RULES_PREFIX}${key}`] = function () {
    return policy;
  };
}

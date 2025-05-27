import { Schema, Document, QuerySelector, Model } from 'mongoose';

export const DAC_RULES_PREFIX = '__dacRules_';

/**
 * @publicApi
 */
export type RuleType = 'query' | 'count' | 'update' | 'delete' | 'save';

type QueryLike = 'query' | 'count';

type IsOnlyQueryOrCount<RT> = RT extends QueryLike
  ? Exclude<RT, QueryLike> extends never
    ? true
    : false
  : false;

type RuleField<T, RT> = IsOnlyQueryOrCount<RT> extends true ? QuerySelector<T> | T : T;

type ExtractModelType<S> = S extends Schema<infer T, any, any, any> ? T : never;

/**
 * @publicApi
 */
export interface AccessPolicyRule<T extends Model<any> = any, RT extends RuleType = RuleType> {
  type: RT[];
  rule: (get: (key: string) => any) => {
    [K in keyof Omit<T, keyof Document>]?: RuleField<T[K], RT>;
  };
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
export function defineRule<T extends Schema<any> = any, RT extends RuleType = RuleType>(
  schema: T,
  key: string,
  policy: AccessPolicyRule<ExtractModelType<T>, RT>,
) {
  schema.statics[`${DAC_RULES_PREFIX}${key}`] = function () {
    return policy;
  };
}

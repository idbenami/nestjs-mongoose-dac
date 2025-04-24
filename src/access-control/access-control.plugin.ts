import { Schema } from 'mongoose';
import { DAC_RULES_KEY, DACRules } from '../decorators';
import { EnrichmentsService } from './enrichments.service';

const queryHookTypes = [
  'estimatedDocumentCount',
  'countDocuments',
  'deleteMany',
  'distinct',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndReplace',
  'findOneAndUpdate',
  'replaceOne',
  'updateMany',
  'updateOne',
  'deleteOne',

  // 'aggregate', // Be careful with aggregate, might need more complex logic
];

const mutationHookTypes = [
  'updateOne',
  'updateMany',
  'findOneAndReplace',
  'findOneAndUpdate',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
];

// export function applyAccessControlPlugin(schema: Schema, enrichmentsService: EnrichmentsService) {
//   const policy = schema.statics.__accessPolicy;

//   if (!policy) return;
//   const filter = (policy as any)() as AccessPolicy;

//   for (const method of queryHookTypes) {
//     schema.pre(method as any, function () {
//       const user = accCtx.getUser?.();
//       if (!user) return;

//       const fields = filter.condition(user);
//       (this as any).where({ ...fields });
//     });
//   }

//   for (const method of mutationHookTypes) {
//     schema.pre(method as any, function () {
//       const user = accCtx.getUser?.();
//       if (!user) return;

//       const fields = filter.condition(user);
//       (this as any).where({ ...fields });
//     });
//   }

//   schema.pre('save', function () {
//     const user = accCtx.getUser?.();
//     if (!user) return;

//     const fields = filter.condition(user);
//     this.set({ ...fields });
//   });
// }

export function applyAccessControlPlugin(
  schemaName: string,
  schema: Schema,
  enrichmentsService: EnrichmentsService,
) {
  const dacRulesGetter = schema.statics[DAC_RULES_KEY];
  if (!dacRulesGetter) return;

  const dacRules = (dacRulesGetter as any)() as DACRules;
  if (!dacRules) return;

  for (const ruleKey in dacRules) {
    const ruleDefinition = dacRules[ruleKey];

    const ruleFn = () => {
      const getEnrichment = (key: string) => {
        const enrichmentValue = enrichmentsService.getEnrichment(schemaName, key);
        if (enrichmentValue) {
          return enrichmentValue;
        }

        throw new Error(`Enrichment function for key "${key}" not found`);
      };

      return ruleDefinition.rule(getEnrichment);
    };

    for (const method of queryHookTypes) {
      schema.pre(method as any, function () {
        const fields = ruleFn();
        (this as any).where({ ...fields });
      });
    }

    for (const method of mutationHookTypes) {
      schema.pre(method as any, function () {
        const fields = ruleFn();
        (this as any).where({ ...fields });
      });
    }

    schema.pre('save', function () {
      const fields = ruleFn();
      this.set({ ...fields });
    });
  }
}

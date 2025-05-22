import { Schema } from 'mongoose';
import { AccessPolicyRuleType, DAC_RULES_PREFIX, DACRules } from './rule-definer';
import { EnrichmentsService } from './enrichments.service';

type EnrichmentFunction = () => Partial<Record<string | number | symbol, any>>;

const hasRules = (rules: Record<any, EnrichmentFunction>): boolean => {
  return Object.keys(rules).length > 0;
};

const ruleTypes = ['query', 'count', 'update', 'delete', 'save'] as const;

const buildFields = (
  rules: Record<any, EnrichmentFunction>,
): Record<string | number | symbol, any> => {
  return Object.keys(rules).reduce((acc, ruleKey) => {
    const ruleFn = rules[ruleKey];
    const ruleFields = ruleFn();
    return { ...acc, ...ruleFields };
  }, {});
};

export function applyAccessControlPlugin(
  schemaName: string,
  schema: Schema,
  enrichmentsService: EnrichmentsService,
) {
  const dacRules = Object.keys(schema.statics).reduce((acc, key) => {
    if (key.startsWith(DAC_RULES_PREFIX)) {
      const ruleKey = key.replace(DAC_RULES_PREFIX, '');
      const ruleDefinition = (schema.statics as any)[key]();
      acc[ruleKey] = ruleDefinition;
    }
    return acc;
  }, {} as DACRules);

  if (Object.keys(dacRules).length === 0) {
    return;
  }

  const getEnrichment = (key: string) => {
    const enrichmentValue = enrichmentsService.getEnrichment(schemaName, key);
    if (enrichmentValue) {
      return enrichmentValue;
    }

    throw new Error(`Enrichment function for key "${key}" not found`);
  };

  const enrichmentsOptionsMap: Record<AccessPolicyRuleType, Record<string, EnrichmentFunction>> = {
    query: {},
    count: {},
    update: {},
    delete: {},
    save: {},
  };

  for (const ruleKey in dacRules) {
    const ruleDefinition = dacRules[ruleKey];
    const ruleFn = () => ruleDefinition.rule(getEnrichment);

    const types = Array.isArray(ruleDefinition.type) ? ruleDefinition.type : [ruleDefinition.type];

    for (const type of ruleTypes) {
      if (types.includes(type)) {
        enrichmentsOptionsMap[type][ruleKey] = ruleFn;
      }
    }
  }

  // query: find, findOne, distinct
  if (hasRules(enrichmentsOptionsMap.query)) {
    for (const method of ['find', 'findOne'] as const) {
      schema.pre(method, { document: false, query: true }, function (next) {
        const fields = buildFields(enrichmentsOptionsMap.query);
        this.where({ ...fields });

        next();
      });
    }

    schema.pre('distinct', { document: false, query: true }, function (next) {
      const fields = buildFields(enrichmentsOptionsMap.query);
      this.where({ ...fields });

      next();
    });
  }

  // count: countDocuments, estimatedDocumentCount
  if (hasRules(enrichmentsOptionsMap.count)) {
    schema.pre('countDocuments', { document: false, query: true }, function (next) {
      const fields = buildFields(enrichmentsOptionsMap.count);
      this.where({ ...fields });

      next();
    });

    schema.pre('estimatedDocumentCount', { document: false, query: true }, function (next) {
      const fields = buildFields(enrichmentsOptionsMap.count);
      this.where({ ...fields });

      next();
    });
  }

  // update: updateOne, updateMany, findOneAndUpdate, replaceOne, findOneAndReplace
  if (hasRules(enrichmentsOptionsMap.update)) {
    schema.pre('updateOne', { document: true, query: false }, function (next) {
      const fields = buildFields(enrichmentsOptionsMap.update);
      this.set({ ...fields });

      next();
    });

    schema.pre('updateOne', { document: false, query: true }, function (next) {
      if (hasRules(enrichmentsOptionsMap.query)) {
        const fields = buildFields(enrichmentsOptionsMap.query);
        this.where({ ...fields });
      }

      const fields = buildFields(enrichmentsOptionsMap.update);
      this.set({ ...fields });

      next();
    });

    schema.pre('findOneAndUpdate', function (next) {
      if (hasRules(enrichmentsOptionsMap.query)) {
        const fields = buildFields(enrichmentsOptionsMap.query);
        this.where({ ...fields });
      }

      const fields = buildFields(enrichmentsOptionsMap.update);
      this.set({ ...fields });

      next();
    });

    schema.pre('replaceOne', function (next) {
      const fields = buildFields(enrichmentsOptionsMap.update);

      const replacement = this.getUpdate();

      this.setUpdate({ ...replacement, ...fields });
      next();
    });

    schema.pre('findOneAndReplace', function (next) {
      if (hasRules(enrichmentsOptionsMap.query)) {
        const fields = buildFields(enrichmentsOptionsMap.query);
        this.where({ ...fields });
      }

      const fields = buildFields(enrichmentsOptionsMap.update);
      const replacement = this.getUpdate();

      this.setUpdate({ ...replacement, ...fields });
      next();
    });

    schema.pre('updateMany', function (next) {
      if (hasRules(enrichmentsOptionsMap.query)) {
        const fields = buildFields(enrichmentsOptionsMap.query);
        this.where({ ...fields });
      }

      const fields = buildFields(enrichmentsOptionsMap.update);
      this.set({ ...fields });

      next();
    });
  }

  // delete: deleteOne, deleteMany, findOneAndDelete
  if (hasRules(enrichmentsOptionsMap.delete)) {
    schema.pre('deleteOne', { document: true, query: false }, function (next) {
      const fields = buildFields(enrichmentsOptionsMap.delete);

      for (const key in fields) {
        if (this[key] !== fields[key]) {
          throw new Error('You are not allowed to delete this document');
        }
      }

      next();
    });
    schema.pre('deleteOne', { document: false, query: true }, function (next) {
      const fields = buildFields(enrichmentsOptionsMap.delete);
      this.where({ ...fields });

      next();
    });
    schema.pre('findOneAndDelete', function (next) {
      const fields = buildFields(enrichmentsOptionsMap.delete);
      this.where({ ...fields });

      next();
    });
    schema.pre('deleteMany', function (next) {
      const fields = buildFields(enrichmentsOptionsMap.delete);
      this.where({ ...fields });

      next();
    });
  }

  // save: save, insertMany
  if (hasRules(enrichmentsOptionsMap.save)) {
    schema.pre('save', function (next) {
      const fields = buildFields(enrichmentsOptionsMap.save);
      this.set({ ...fields });

      next();
    });

    schema.pre('insertMany', function (next, docs) {
      const fields = buildFields(enrichmentsOptionsMap.save);
      for (const doc of docs) {
        doc.set({ ...fields });
      }
      next();
    });
  }

  // TODO: implement bulkWrite and aggregate
}

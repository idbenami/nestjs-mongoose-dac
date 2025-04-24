import { Provider } from '@nestjs/common';
import { Connection, Document, Model } from 'mongoose';
import { AsyncModelFactory, getConnectionToken, ModelDefinition } from '@nestjs/mongoose';
import { getModelToken } from './common/utils';
import { applyAccessControlPlugin } from './access-control/access-control.plugin';
import { EnrichmentsService } from './access-control/enrichments.service';

export function createMongooseProviders(
  connectionName?: string,
  options: ModelDefinition[] = [],
): Provider[] {
  return options.reduce(
    (providers, option) => [
      ...providers,
      ...(option.discriminators || []).map((d) => ({
        provide: getModelToken(d.name, connectionName),
        useFactory: (model: Model<Document>, enrichmentsService: EnrichmentsService) => {
          applyAccessControlPlugin(option.name, option.schema, enrichmentsService);

          return model.discriminator(d.name, d.schema, d.value);
        },
        inject: [getModelToken(option.name, connectionName), EnrichmentsService],
      })),
      {
        provide: getModelToken(option.name, connectionName),
        useFactory: (connection: Connection, enrichmentsService: EnrichmentsService) => {
          applyAccessControlPlugin(option.name, option.schema, enrichmentsService);
          const model = connection.models[option.name]
            ? connection.models[option.name]
            : connection.model(option.name, option.schema, option.collection);

          return model;
        },
        inject: [getConnectionToken(connectionName), EnrichmentsService],
      },
    ],
    [] as Provider[],
  );
}

export function createMongooseAsyncProviders(
  connectionName?: string,
  modelFactories: AsyncModelFactory[] = [],
): Provider[] {
  return modelFactories.reduce((providers, option) => {
    return [
      ...providers,
      ...(option.discriminators || []).map((d) => ({
        provide: getModelToken(d.name, connectionName),
        useFactory: (model: Model<Document>, enrichmentsService: EnrichmentsService) => {
          applyAccessControlPlugin(option.name, d.schema, enrichmentsService);

          return model.discriminator(d.name, d.schema, d.value);
        },
        inject: [getModelToken(option.name, connectionName), EnrichmentsService],
      })),
      {
        provide: getModelToken(option.name, connectionName),
        useFactory: async (
          connection: Connection,
          enrichmentsService: EnrichmentsService,
          ...args: unknown[]
        ) => {
          const schema = await option.useFactory(...args);
          const model = connection.model(option.name, schema, option.collection);
          applyAccessControlPlugin(option.name, schema, enrichmentsService);

          return model;
        },
        inject: [getConnectionToken(connectionName), EnrichmentsService, ...(option.inject || [])],
      },
    ];
  }, [] as Provider[]);
}

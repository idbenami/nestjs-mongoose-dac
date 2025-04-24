import { DynamicModule, flatten, Module } from '@nestjs/common';
import {
  AsyncModelFactory,
  ModelDefinition,
  MongooseModuleAsyncOptions,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import { MongooseCoreModule } from '@nestjs/mongoose/dist/mongoose-core.module';
import { createMongooseAsyncProviders, createMongooseProviders } from './mongoose-dac.providers';
import { AccessControlModule } from './access-control/access-control.module';

/**
 * @publicApi
 */
@Module({
  imports: [AccessControlModule],
  exports: [AccessControlModule],
})
export class MongooseModule {
  static forRoot(uri: string, options: MongooseModuleOptions = {}): DynamicModule {
    return {
      module: MongooseModule,
      imports: [MongooseCoreModule.forRoot(uri, options)],
    };
  }

  static forRootAsync(options: MongooseModuleAsyncOptions): DynamicModule {
    return {
      module: MongooseModule,
      imports: [MongooseCoreModule.forRootAsync(options)],
    };
  }

  static forFeature(models: ModelDefinition[], connectionName?: string): DynamicModule {
    const providers = createMongooseProviders(connectionName, models);

    return {
      module: MongooseModule,
      providers: [...providers],
      exports: [...providers],
    };
  }

  static forFeatureAsync(
    factories: AsyncModelFactory[] = [],
    connectionName?: string,
  ): DynamicModule {
    const providers = createMongooseAsyncProviders(connectionName, factories);
    const imports = factories.map((factory) => factory.imports || []);
    const uniqImports = new Set(flatten(imports));

    return {
      module: MongooseModule,
      imports: [...uniqImports],
      providers: providers,
      exports: providers,
    };
  }
}

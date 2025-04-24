/**
 * Exports all the necessary modules and decorators from the @nestjs/mongoose package.
 */
export { InjectConnection, getConnectionToken } from '@nestjs/mongoose/dist/common';
export {
  Prop,
  PropOptions,
  Schema,
  SchemaOptions,
  Virtual,
  VirtualOptions,
} from '@nestjs/mongoose/dist/decorators';
export { CannotDetermineTypeError } from '@nestjs/mongoose/dist/errors';
export {
  DefinitionsFactory,
  SchemaFactory,
  VirtualsFactory,
} from '@nestjs/mongoose/dist/factories';
export {
  AsyncModelFactory,
  DiscriminatorOptions,
  ModelDefinition,
  MongooseModuleAsyncOptions,
  MongooseModuleFactoryOptions,
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose/dist/interfaces';
export { IsObjectIdPipe, ParseObjectIdPipe } from '@nestjs/mongoose/dist/pipes';
export { raw } from '@nestjs/mongoose/dist/utils';

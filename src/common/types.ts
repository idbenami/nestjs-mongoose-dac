import { Schema } from 'mongoose';

type SchemaFieldTypeBase = string | number | boolean | Date;

export type SchemaFieldType =
  | SchemaFieldTypeBase
  | SchemaFieldTypeBase[]
  | object
  | Schema.Types.Buffer
  | Schema.Types.ObjectId
  | Schema.Types.Mixed
  | null
  | undefined;

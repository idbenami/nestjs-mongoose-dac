<p align="center">
  <a href="https://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>
<div align="center">
  <h1 style="font-size: 2em;">NestJS Mongoose DAC</h1>
  <h3 style="font-size: 1em;">@nestjs/mongoose with document-access-control</h3>

[Quick Start](#quick-start) • [Usage](#usage) • [API Reference](#api-reference) • [FAQ](#faq) • [Contributing](#contributing) • [License](#license)

</div>

Did you ever find yourself in a situation where you need to restrict access to certain documents in a collection? Tired of passing that user object just to save who updated a document?

`nestjs-mongoose-dac` is a superset of `@nestjs/mongoose` that introduces **Document Access Control (DAC)** capabilities. It provides tools to define and enforce access policies on Mongoose models, enabling fine-grained control over data access and manipulation.

## Quick Start

```bash
npm install nestjs-mongoose-dac mongoose
```

If your project already uses `@nestjs/mongoose`, please remove it first, as this package includes it internally.

## Usage

### Configuration

Since this package is a superset of `@nestjs/mongoose` all configurations are the same, `MongooseModule#forRoot`, `MongooseModule#forRootAsync`, `MongooseModule#forFeature`, etc.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from 'nestjs-mongoose-dac';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:27017/mydb')],
})
export class AppModule {}

// cats.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from 'nestjs-mongoose-dac';
import { Cat, CatSchema } from './cat.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Cat', schema: CatSchema }])],
})
export class CatsModule {}
```

### Defining Access Policy Rules

Rules can be defined using the `defineRule` function.

```typescript
import { Document, Types } from 'mongoose';
import { defineRule, Prop, Schema, SchemaFactory } from 'nestjs-mongoose-dac';

@Schema()
export class Cat extends Document {
  @Prop()
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;

  @Prop()
  ownerId: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);

defineRule(CatSchema, 'ownerValidation', {
  type: ['query'],
  rule: (get) => ({ ownerId: get('ownerId') }),
});
```

### Enrichments

`EnrichmentsService` allows you to set and retrieve contextual data for access control rules.
The service uses `AsyncLocalStorage` to store the data per request lifecycle.

#### Steps to add enrichments to rules:

1. Add enrichments - preferably in a middleware/interceptor, or wherever you process incoming requests

```typescript
import { Injectable } from '@nestjs/common';
import { EnrichmentsService } from 'nestjs-mongoose-dac';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class CatOwnerInterceptor implements NestInterceptor {
  constructor(private readonly enrichmentsService: EnrichmentsService) {}

  intercept(context: ExecutionContext, next: CallHandler<any>) {
    const request = context.switchToHttp().getRequest<Request>();

    const ownerId = request.cookies['ownerId'];

    this.enrichmentsService.setGlobalEnrichment('ownerId', ownerId);
    // or set it per schema
    this.enrichmentsService.setEnrichment(Cat.name, 'ownerId', ownerId);

    return next.handle();
  }
}
```

2. Use the data in rules - use the provided `get` function for retriving enrichments

```typescript
defineRule(CatSchema, 'ownerValidation', {
  type: ['query'],
  rule: (get) => ({ ownerId: get('ownerId') }),
});
```

## API Reference

For detailed API reference of `@nestjs/mongoose`, please refer to the official [NestJS Mongoose documentation](https://docs.nestjs.com/techniques/mongodb).

### `defineRule`

- **`defineRule<T>(schema: Schema, key: string, policy: AccessPolicyRule<T>): void`**
  - Defines an access policy for a Mongoose schema.
  - `schema`: The Mongoose schema to which the rule applies.
  - `key`: The name of the rule - should be unique per schema.
  - `policy`: The access policy rule object, which includes:
    - `type`: An array of `AccessPolicyRuleType`, each one representing mongoose operations.
      - query: `find`, `findOne`, `distinct`
      - count: `countDocuments`, `estimatedDocumentCount`
      - update: `updateOne`, `updateMany`, `findOneAndUpdate`, `replaceOne`, `findOneAndReplace`
      - delete: `deleteOne`, `deleteMany`, `findOneAndDelete`
      - save: `save` (document level), `insertMany`
    - `rule`: A function that takes a `get` function and returns a query object or a boolean.

### `EnrichmentsService`

- **`setEnrichment(schemaName: string, key: string, value: unknown)`**

  - Sets an enrichment value for a specific schema.
  - `schemaName`: The name of the schema to which the enrichment applies.
  - `key`: The key for the enrichment value.
  - `value`: The value to set.

- **`setGlobalEnrichment(key: string, value: unknown)`**

  - Sets a global enrichment value - for all schemas to use in rules.
  - `key`: The key for the enrichment value.
  - `value`: The value to set.

## FAQ

### Why not just use `@nestjs/mongoose`?

`@nestjs/mongoose` is the base package for working with Mongoose in NestJS. However, it does not enhances or offers more "fullstack" tools to ease the work with the database. This package extends `@nestjs/mongoose` to add access-rules capabilities, enrichments and more, making it easier to create and manage complex workflows.

### How does the enrichments work?

The `EnrichmentsService` uses `AsyncLocalStorage` to store enrichment data per request lifecycle. This allows you to set contextual data for access control rules without passing it explicitly through the request.

## Contributing

Contributions welcome! Read the [contributing guidelines](CONTRIBUTING.md) to get started.

## Support

🐛 [Issues](https://github.com/idbenami/nestjs-mongoose-dac/issues)

## License

MIT

---

Keywords: nestjs, mongoose, dac, document-access-control, nestjs mongoose, mongo, mongodb

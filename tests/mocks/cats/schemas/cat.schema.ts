import { Document, Types } from 'mongoose';
import { defineRule, Prop, Schema, SchemaFactory } from '../../../../src';

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

  // see https://github.com/nestjs/mongoose/issues/2421
  @Prop({
    type: [{ type: Types.ObjectId, ref: Cat.name }],
    default: [],
  })
  kitten: Types.ObjectId[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CatSchema = SchemaFactory.createForClass(Cat);

defineRule<Cat>(CatSchema, 'ownerValidation', {
  type: ['save', 'query', 'update', 'delete', 'count'],
  rule: (get) => ({ ownerId: get('ownerId') }),
});

defineRule<Cat>(CatSchema, 'updatedAt', {
  type: ['save', 'update'],
  rule: () => ({ updatedAt: Date.now() }),
});

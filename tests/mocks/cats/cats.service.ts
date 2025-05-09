import { Injectable } from '@nestjs/common';
import { Document, Model, Types } from 'mongoose';
import { InjectModel } from '../../../src';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './schemas/cat.schema';

export type PartialCatUpdate = Partial<Omit<Cat, keyof Document>>;

@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private readonly catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel({
      ...createCatDto,
      kitten: createCatDto.kitten?.map((kitten) => new Types.ObjectId(kitten)),
    });
    return createdCat.save();
  }

  async findAll(filter: PartialCatUpdate): Promise<Cat[]> {
    const data = await this.catModel.find({ ...filter }).exec();

    return data;
  }

  async findOne(id: string): Promise<Cat | null> {
    return this.catModel.findById(id).populate('kitten').exec();
  }

  async findOneAndDelete(id: string): Promise<Cat | null> {
    return this.catModel.findByIdAndDelete(id).exec();
  }

  async findOneAndReplace(id: string, replace: PartialCatUpdate): Promise<Cat | null> {
    const data = await this.catModel
      .findOneAndReplace({ _id: id }, { ...replace }, { returnDocument: 'after' })
      .exec();

    return data;
  }

  async findOneAndUpdate(id: string, update: PartialCatUpdate): Promise<Cat | null> {
    return this.catModel
      .findOneAndUpdate({ _id: id }, { ...update }, { returnDocument: 'after' })
      .exec();
  }

  async replaceOne(id: string, replace: PartialCatUpdate) {
    await this.catModel.replaceOne({ _id: id }, { ...replace });

    return this.findOne(id);
  }

  async updateMany(filter: PartialCatUpdate, update: PartialCatUpdate) {
    return this.catModel.updateMany(filter, update).exec();
  }

  async updateOne(id: string, update: PartialCatUpdate) {
    return this.catModel.updateOne({ _id: id }, { ...update }).exec();
  }

  async deleteOne(id: string) {
    return this.catModel.deleteOne({ _id: id }).exec();
  }

  async deleteMany(filter: PartialCatUpdate) {
    return this.catModel.deleteMany(filter).exec();
  }

  async countDocuments(filter?: PartialCatUpdate) {
    const res = await this.catModel.countDocuments({ ...filter }).exec();

    return res;
  }

  async estimatedDocumentCount() {
    return this.catModel.estimatedDocumentCount().exec();
  }

  async distinct(field: keyof Omit<Cat, keyof Document>) {
    const res = await this.catModel.distinct(field).exec();

    return res;
  }
}

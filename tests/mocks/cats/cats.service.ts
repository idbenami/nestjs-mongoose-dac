import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '../../../src';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './schemas/cat.schema';

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

  async findAll(): Promise<Cat[]> {
    const data = await this.catModel.find();

    return data;
  }
}

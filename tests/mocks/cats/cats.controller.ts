import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Document } from 'mongoose';
import { CatsService, PartialCatUpdate } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { Cat } from './schemas/cat.schema';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    return this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(@Query() filters: PartialCatUpdate): Promise<Cat[]> {
    return this.catsService.findAll(filters);
  }

  @Get('/one/:id')
  async findOne(@Param('id') id: string): Promise<Cat | null> {
    const data = await this.catsService.findOne(id);

    if (!data) {
      throw new NotFoundException('Cat not found');
    }

    return data;
  }

  @Delete('/one/:id')
  async findOneAndDelete(@Param('id') id: string): Promise<Cat | null> {
    const data = await this.catsService.findOneAndDelete(id);

    if (!data) {
      throw new NotFoundException('Cat not found');
    }

    return data;
  }

  @Patch('/one/:id/replace')
  async findOneAndReplace(
    @Param('id') id: string,
    @Body() replace: PartialCatUpdate,
  ): Promise<Cat | null> {
    const data = await this.catsService.findOneAndReplace(id, replace);

    if (!data) {
      throw new NotFoundException('Cat not found');
    }

    return data;
  }

  @Post('/one/:id/update')
  async findOneAndUpdate(
    @Param('id') id: string,
    @Body() update: PartialCatUpdate,
  ): Promise<Cat | null> {
    const data = await this.catsService.findOneAndUpdate(id, { ...update });

    if (!data) {
      throw new NotFoundException('Cat not found');
    }

    return data;
  }

  @Post('/one/:id/replace')
  async replaceOne(@Param('id') id: string, @Body() replace: PartialCatUpdate) {
    return this.catsService.replaceOne(id, replace);
  }

  @Patch('/many')
  async updateMany(filter: PartialCatUpdate, @Body() update: PartialCatUpdate) {
    return this.catsService.updateMany(filter, update);
  }

  @Patch('/one/:id/update')
  async updateOne(@Param('id') id: string, @Body() update: PartialCatUpdate) {
    return this.catsService.updateOne(id, { ...update });
  }

  @Delete('/one/:id')
  async deleteOne(@Param('id') id: string) {
    return this.catsService.deleteOne(id);
  }

  @Delete('/many')
  async deleteMany(@Body() filter: PartialCatUpdate) {
    return this.catsService.deleteMany(filter);
  }

  @Get('/count')
  async countDocuments(@Body() filter?: PartialCatUpdate) {
    const count = await this.catsService.countDocuments({ ...filter });

    return { count };
  }

  @Get('/estimated-count')
  async estimatedDocumentCount() {
    return this.catsService.estimatedDocumentCount();
  }

  @Get('/distinct/:field')
  async distinct(@Param('field') field: keyof Omit<Cat, keyof Document>) {
    return this.catsService.distinct(field);
  }
}

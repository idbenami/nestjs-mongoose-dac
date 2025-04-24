import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { MongoDbTestkit } from '../testkit';
import { AppModule } from '../mocks/app.module';
import { CreateCatDto } from '../mocks/cats/dto/create-cat.dto';
import { Cat } from '../mocks/cats/schemas/cat.schema';
import { ConnectionService, IConnectionService } from '../mocks/connection/connection.service';

describe('Mongoose', () => {
  let server: Server;
  let app: INestApplication;
  const mongoDbTestkit = new MongoDbTestkit();

  beforeAll(async () => {
    await mongoDbTestkit.start();
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConnectionService)
      .useFactory({
        factory: (): IConnectionService => ({
          getConnectionOptions() {
            return mongoDbTestkit.getUrl();
          },
        }),
      })
      .compile();

    app = module.createNestApplication();
    server = app.getHttpServer();
    await app.init();
  });

  afterAll(async () => {
    await mongoDbTestkit.stop();
  });

  it(`should return created document`, (done) => {
    const createDto = { name: 'Nest', breed: 'Maine coon', age: 5 };
    request(server)
      .post('/cats')
      .send(createDto)
      .expect(201)
      .end((err, { body }) => {
        expect(body.name).toEqual(createDto.name);
        expect(body.age).toEqual(createDto.age);
        expect(body.breed).toEqual(createDto.breed);
        done();
      });
  });

  it('should populate array of kittens', async () => {
    let createDto: CreateCatDto = {
      name: 'Kitten',
      breed: 'Maine coon',
      age: 1,
    };

    const kitten: Cat = await new Promise((resolve) => {
      request(server)
        .post('/cats')
        .send(createDto)
        .expect(201)
        .end((err, { body }) => {
          expect(body.name).toEqual(createDto.name);
          expect(body.age).toEqual(createDto.age);
          expect(body.breed).toEqual(createDto.breed);
          resolve(body);
        });
    });

    createDto = {
      ...createDto,
      name: 'Nest',
      age: 5,
      kitten: [kitten._id as string],
    };

    const parent = await new Promise<string>((resolve) => {
      request(server)
        .post('/cats')
        .send(createDto)
        .expect(201)
        .end((err, { body }) => {
          expect(body.name).toEqual(createDto.name);
          expect(body.age).toEqual(createDto.age);
          expect(body.breed).toEqual(createDto.breed);
          resolve(body._id as string);
        });
    });

    await new Promise<void>((resolve) => {
      request(server)
        .get(`/cat/${parent}`)
        .expect(200)
        .end((err, { body }) => {
          expect(Array.isArray(body.kitten)).toBe(true);
          expect(body.kitten[0]._id).toBe(kitten._id);
          expect(body.kitten[0].name).toBe(kitten.name);
          expect(body.kitten[0].breed).toBe(kitten.breed);
          expect(body.kitten[0].age).toBe(kitten.age);
          resolve();
        });
    });
  });

  afterEach(async () => {
    await app.close();
  });
});

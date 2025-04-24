import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { LazyAppModule } from '../mocks/lazy-app.module';
import { MongoDbTestkit } from '../testkit';
import { ConnectionService, IConnectionService } from '../mocks/connection/connection.service';

describe('Mongoose lazy connection', () => {
  let server: Server;
  let app: INestApplication;
  const mongoDbTestkit = new MongoDbTestkit();

  beforeAll(async () => {
    await mongoDbTestkit.start();
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [LazyAppModule],
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

  afterEach(async () => {
    await app.close();
  });
});

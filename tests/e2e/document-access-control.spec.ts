import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { MongoDbTestkit } from '../testkit';
import { AppModule } from '../mocks/app.module';
import { ConnectionService, IConnectionService } from '../mocks/connection/connection.service';
import { EnrichmentsService } from '../../src/access-control/enrichments.service';

describe('Document Access Control', () => {
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

  it(`should return documents by current user owner id`, async () => {
    const agent1 = request.agent(server);
    agent1.set('Cookie', 'ownerId=1');
    const agent2 = request.agent(server);
    agent2.set('Cookie', 'ownerId=2');

    const createDto = { name: 'Nest', breed: 'Maine coon', age: 5 };
    await agent1.post('/cats').send(createDto).expect(201);

    const create2Dto = { name: 'Joe', breed: 'Golfer', age: 7 };
    await agent2.post('/cats').send(create2Dto).expect(201);

    const res1 = await agent1.get('/cats').expect(200);
    expect(res1.body).toHaveLength(1);

    const res2 = await agent2.get('/cats').expect(200);
    expect(res2.body).toHaveLength(1);
  });

  afterEach(async () => {
    await app.close();
  });
});

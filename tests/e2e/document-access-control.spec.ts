import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { de, faker } from '@faker-js/faker';
import { MongoDbTestkit } from '../testkit';
import { AppModule } from '../mocks/app.module';
import { ConnectionService, IConnectionService } from '../mocks/connection/connection.service';
import TestAgent = require('supertest/lib/agent');
import { PartialCatUpdate } from '../mocks/cats/cats.service';

const buildCat = (base: PartialCatUpdate = {}) => ({
  name: faker.person.firstName(),
  breed: faker.animal.cat(),
  age: faker.number.int({ min: 0, max: 30 }),
  ...base,
});

const agentsCount = 4;

describe('Document Access Control', () => {
  let server: Server;
  let app: INestApplication;
  let mongoDbTestkit: MongoDbTestkit;

  const agents: TestAgent[] = [];

  beforeAll(async () => {
    mongoDbTestkit = new MongoDbTestkit();
    await mongoDbTestkit.start();

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

    Array.from({ length: agentsCount }, (_, i) => {
      const agent = request.agent(server);
      agent.set('Cookie', `ownerId=${i + 1}`);
      agents.push(agent);
    });
  });

  afterAll(async () => {
    await app.close();
    await mongoDbTestkit.stop();
  });

  it(`should return documents by current user owner id`, async () => {
    const createDto = buildCat();
    await agents[0].post('/cats').send(createDto).expect(201);

    const create2Dto = buildCat();
    await agents[1].post('/cats').send(create2Dto).expect(201);

    const res1 = await agents[0].get('/cats').expect(200);
    expect(res1.body).toHaveLength(1);
    expect(res1.body[0].ownerId).toEqual('1');
    expect(res1.body[0].name).toEqual(createDto.name);

    const res2 = await agents[1].get('/cats').expect(200);
    expect(res2.body).toHaveLength(1);
    expect(res2.body[0].ownerId).toEqual('2');
    expect(res2.body[0].name).toEqual(create2Dto.name);
  });

  describe('operation types', () => {
    beforeEach(async () => {
      const cats = Array.from({ length: faker.number.int({ min: 12, max: 32 }) }, (_, i) =>
        buildCat({ ownerId: `${(i % agentsCount) + 1}` }),
      );

      await mongoDbTestkit.client!.db('test').collection('cats').insertMany(cats);
    });

    // it('estimatedDocumentCount', async () => {
    //   const agentId = faker.number.int({ min: 1, max: 3 });
    //   const agent = agents[agentId - 1];

    //   const exceptedCount = await mongoDbTestkit
    //     .client!.db('test')
    //     .collection('cats')
    //     .estimatedDocumentCount({   });

    //   const res = await agent.get('/cats/estimated-count').expect(200);
    //   expect(res.body).toEqual(exceptedCount);
    // });

    it('countDocuments', async () => {
      const agentId = faker.number.int({ min: 1, max: agentsCount });
      const agent = agents[agentId - 1];

      const exceptedCount = await mongoDbTestkit
        .client!.db('test')
        .collection('cats')
        .countDocuments({ ownerId: `${agentId}` });

      const res = await agent.get('/cats/count').expect(200);
      expect(res.body.count).toEqual(exceptedCount);
    });

    it('deleteMany', async () => {
      const agentId = faker.number.int({ min: 1, max: agentsCount });
      const agent = agents[agentId - 1];

      const beforeCountTotal = await mongoDbTestkit
        .client!.db('test')
        .collection('cats')
        .countDocuments({});

      const beforeCountOthers = await mongoDbTestkit
        .client!.db('test')
        .collection('cats')
        .countDocuments({ ownerId: { $ne: `${agentId}` } });

      const res = await agent.delete('/cats/many').expect(200);

      expect(beforeCountTotal - res.body.deletedCount).toEqual(beforeCountOthers);
    });

    it('distinct', async () => {
      const agentId = faker.number.int({ min: 1, max: agentsCount });
      const agent = agents[agentId - 1];

      const exceptedDistinct = await mongoDbTestkit
        .client!.db('test')
        .collection('cats')
        .distinct('ownerId', { ownerId: `${agentId}` });

      const res = await agent.get('/cats/distinct/ownerId').expect(200);
      expect(res.body).toEqual(exceptedDistinct);
    });

    describe('find', () => {
      it("should find the owner's cats", async () => {
        const agentId = faker.number.int({ min: 1, max: agentsCount });
        const agent = agents[agentId - 1];

        const exceptedCats = await mongoDbTestkit
          .client!.db('test')
          .collection('cats')
          .find({ ownerId: `${agentId}` })
          .toArray();

        const res = await agent.get('/cats').expect(200);
        expect(res.body.length).toEqual(exceptedCats.length);
      });

      it("should not find other owner's cats", async () => {
        const [agent1Id, agent2Id] = faker.helpers.arrayElements(
          Array.from({ length: agentsCount }, (_, i) => i + 1),
          2,
        );
        const agent1 = agents[agent1Id - 1];

        const exceptedCats = await mongoDbTestkit
          .client!.db('test')
          .collection('cats')
          .find({ ownerId: `${agent1Id}` })
          .toArray();

        const res = await agent1.get(`/cats?ownerId=${agent2Id}`).expect(200);
        expect(res.body.length).toEqual(exceptedCats.length);
      });
    });

    describe('findOne', () => {
      it('should return one cat', async () => {
        const agentId = faker.number.int({ min: 1, max: agentsCount });
        const agent = agents[agentId - 1];

        const exceptedCat = await mongoDbTestkit
          .client!.db('test')
          .collection('cats')
          .findOne({ ownerId: `${agentId}` });

        const res = await agent.get(`/cats/one/${exceptedCat!._id}`).expect(200);
        expect(res.body.name).toEqual(exceptedCat?.name);
        expect(res.body.ownerId).toEqual(agentId.toString());
      });

      it('should return 404', async () => {
        const agentId = faker.number.int({ min: 1, max: agentsCount });
        const agent = agents[agentId - 1];

        const res = await agent.get('/cats/one/123456789012345678901234').expect(404);
        expect(res.body).toEqual({
          statusCode: 404,
          message: 'Cat not found',
          error: 'Not Found',
        });
      });

      it("should not return since the cat isn't related to the owner", async () => {
        const [agent1Id, agent2Id] = faker.helpers.arrayElements(
          Array.from({ length: agentsCount }, (_, i) => i + 1),
          2,
        );
        const agent2 = agents[agent2Id - 1];

        const exceptedCat = await mongoDbTestkit
          .client!.db('test')
          .collection('cats')
          .findOne({ ownerId: `${agent1Id}` });

        await agent2.get(`/cats/one/${exceptedCat!._id}`).expect(404);
      });
    });

    describe('findOneAndDelete', () => {
      it('should find one and delete', async () => {
        const agentId = faker.number.int({ min: 1, max: agentsCount });
        const agent = agents[agentId - 1];

        const exceptedCat = await mongoDbTestkit
          .client!.db('test')
          .collection('cats')
          .findOne({ ownerId: `${agentId}` });

        const res = await agent.delete(`/cats/one/${exceptedCat!._id}`).expect(200);
        expect(res.body.name).toEqual(exceptedCat?.name);
        expect(res.body.ownerId).toEqual(agentId.toString());
        expect(res.body._id).toEqual(exceptedCat?._id.toString());

        const resFromDb = await mongoDbTestkit
          .client!.db('test')
          .collection('cats')
          .find({ _id: exceptedCat?._id })
          .toArray();

        expect(resFromDb).toHaveLength(0);
      });

      it('should return 404', async () => {
        const agentId = faker.number.int({ min: 1, max: agentsCount });
        const agent = agents[agentId - 1];

        const res = await agent.delete('/cats/one/123456789012345678901234').expect(404);
        expect(res.body).toEqual({
          statusCode: 404,
          message: 'Cat not found',
          error: 'Not Found',
        });
      });
      it("should not find since the cat isn't related to the owner", async () => {
        const [agent1Id, agent2Id] = faker.helpers.arrayElements(
          Array.from({ length: agentsCount }, (_, i) => i + 1),
          2,
        );
        const agent2 = agents[agent2Id - 1];

        const exceptedCat = await mongoDbTestkit
          .client!.db('test')
          .collection('cats')
          .findOne({ ownerId: `${agent1Id}` });

        await agent2.delete(`/cats/one/${exceptedCat!._id}`).expect(404);
      });
    });

    it('findOneAndReplace', async () => {
      const agentId = faker.number.int({ min: 1, max: agentsCount });
      const agent = agents[agentId - 1];

      const oldCat = await mongoDbTestkit
        .client!.db('test')
        .collection('cats')
        .findOne({ ownerId: `${agentId}` });

      const newCat = buildCat();

      const res = await agent.patch(`/cats/one/${oldCat!._id}/replace`).send(newCat).expect(200);

      expect(res.body.name).toEqual(newCat.name);
      expect(res.body.ownerId).toEqual(agentId.toString());
      expect(res.body._id).toEqual(oldCat?._id.toString());
      expect(res.body.age).toEqual(newCat?.age);
    });

    it('findOneAndUpdate', async () => {
      const agentId = faker.number.int({ min: 1, max: agentsCount });
      const agent = agents[agentId - 1];

      const exceptedCat = await mongoDbTestkit
        .client!.db('test')
        .collection('cats')
        .findOne({ ownerId: `${agentId}` });

      const res = await agent
        .post(`/cats/one/${exceptedCat!._id}/update`)
        .send({ name: 'new name' })
        .expect(201);

      expect(res.body.name).toEqual('new name');
      expect(res.body.ownerId).toEqual(agentId.toString());
      expect(res.body._id).toEqual(exceptedCat?._id.toString());
      expect(res.body.age).toEqual(exceptedCat?.age);
    });

    it('replaceOne', async () => {
      const agentId = faker.number.int({ min: 1, max: agentsCount });
      const agent = agents[agentId - 1];

      const oldCat = await mongoDbTestkit
        .client!.db('test')
        .collection('cats')
        .findOne({ ownerId: `${agentId}` });

      const newCat = buildCat();

      const res = await agent.post(`/cats/one/${oldCat!._id}/replace`).send(newCat).expect(201);

      expect(res.body.name).toEqual(newCat.name);
      expect(res.body.ownerId).toEqual(agentId.toString());
      expect(res.body._id).toEqual(oldCat?._id.toString());
    });

    it('updateMany', async () => {});

    it('updateOne', async () => {});

    it('deleteOne', async () => {});
  });
});

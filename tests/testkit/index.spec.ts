import { MongoDbTestkit } from './index';

describe('mongo-testkit', () => {
  let mongoTestkit: MongoDbTestkit;

  beforeAll(async () => {
    mongoTestkit = new MongoDbTestkit();
    await mongoTestkit.start();
  });

  afterAll(async () => {
    await mongoTestkit.stop();
  });

  it('should be defined', () => {
    expect(mongoTestkit).toBeDefined();
    expect(mongoTestkit.client).toBeDefined();
    expect(mongoTestkit.connection).toBeDefined();
  });

  it('should ping the database', async () => {
    const res = await mongoTestkit.client?.db().admin().ping();

    expect(res).toBeDefined();
    expect(res!.ok).toBe(1);
  });

  it('should reset the data', async () => {
    const db = mongoTestkit.client?.db('test_db');

    if (db) {
      await db.collection('test_collection').insertOne({ test: 'test' });
      const res = await db.collection('test_collection').findOne({ test: 'test' });

      expect(res).toBeDefined();
      expect(res!.test).toBe('test');

      await mongoTestkit.resetData();

      const res2 = await db.collection('test_collection').findOne({ test: 'test' });

      expect(res2).toBeNull();
    }
  });
});

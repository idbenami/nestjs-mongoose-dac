import { GenericContainer, PortWithOptionalBinding, StartedTestContainer } from 'testcontainers';
import { Environment } from 'testcontainers/build/types';
import { MongoClient } from 'mongodb';
import { Connection, createConnection } from 'mongoose';
import { cpus } from 'os';
import { logger } from './logger';

// Extend the default timeout so MongoDB binaries can download
jest.setTimeout(60000);

const ROOT_PASSWORD = 'sa';
const MONGODB_PORT = 27017;

const isArm = () =>
  process.arch === 'arm64' || cpus()[0].model.includes('Apple') || process.env.FORCE_ARM === 'true';

export class MongoDbTestkit {
  private container: GenericContainer;
  private startedMongoDBContainer?: StartedTestContainer;
  private url = '';

  public client: MongoClient | null;
  public connection: Connection | null;

  constructor(private readonly options: { port?: number } = {}) {
    if (isArm()) {
      this.container = new GenericContainer('mongo:latest');
    } else {
      this.container = new GenericContainer('bitnami/mongodb:latest');
    }
    this.client = null;
    this.connection = null;
  }

  async start() {
    const _containerPort: PortWithOptionalBinding = this.options.port
      ? { host: this.options.port, container: MONGODB_PORT }
      : MONGODB_PORT;

    const envs: Environment = isArm()
      ? {
          MONGO_INITDB_ROOT_USERNAME: 'root',
          MONGO_INITDB_ROOT_PASSWORD: ROOT_PASSWORD,
        }
      : {
          MONGODB_ROOT_PASSWORD: ROOT_PASSWORD,
          MONGODB_USERNAME: 'test_user',
          MONGODB_PASSWORD: 'test_password',
          MONGODB_DATABASE: 'test_db',
        };

    const container = this.container
      .withDefaultLogDriver()
      .withReuse()
      .withEnvironment(envs)
      .withExposedPorts(_containerPort);
    logger.info('Starting mongo container');

    this.startedMongoDBContainer = await container.start();

    const mappedPort = this.startedMongoDBContainer.getMappedPort(MONGODB_PORT);

    this.url = `mongodb://root:${ROOT_PASSWORD}@localhost:${mappedPort}`;
    logger.info('Mongo container started, root password:', ROOT_PASSWORD);

    this.client = new MongoClient(this.url);
    await this.client.connect();
    this.connection = createConnection();
    logger.info('Mongo client connected');

    return;
  }

  /**
   *
   * @returns {string}
   */
  public getUrl(): string {
    return this.url;
  }

  /**
   *
   * @returns {{host: string, port: number}}
   */
  public getConnectionAddress(): { host: string; port: number } {
    if (this.startedMongoDBContainer) {
      return {
        host: 'localhost',
        port: this.startedMongoDBContainer.getMappedPort(MONGODB_PORT),
      };
    }
    throw new Error('Mongo container not started');
  }

  async stop() {
    await this.connection?.close();
    await this.client?.close();

    if (process.env.TESTCONTAINERS_REUSE_ENABLE === 'true') {
      return;
    }

    await this.startedMongoDBContainer?.stop();
  }

  async resetData() {
    const dbs = await this.client?.db().admin().listDatabases();

    return Promise.all(
      dbs?.databases
        .map((db) => db.name)
        .filter((dbName) => !['admin', 'config', 'local'].includes(dbName))
        .map(async (dbName) => {
          const collections = await this.client?.db(dbName).collections();

          return Promise.all(
            collections?.map(async (collection) => {
              await collection.deleteMany({});
            }) || [],
          );
        }) || [],
    );
  }
}

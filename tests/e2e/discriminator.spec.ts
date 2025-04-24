import { DynamicModule, HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { MongooseModule } from '../../src';
import { EventModule } from '../mocks/event/event.module';
import {
  ClickLinkEvent,
  ClieckLinkEventSchema,
} from '../mocks/event/schemas/click-link-event.schema';
import { Event, EventSchema } from '../mocks/event/schemas/event.schema';
import { SignUpEvent, SignUpEventSchema } from '../mocks/event/schemas/sign-up-event.schema';
import { MongoDbTestkit } from '../testkit';
import { ConnectionModule } from '../mocks/connection/connection.module';
import { ConnectionService, IConnectionService } from '../mocks/connection/connection.service';

const testCase: [string, DynamicModule][] = [
  [
    'forFeature',
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: ClickLinkEvent.name, schema: ClieckLinkEventSchema },
          { name: SignUpEvent.name, schema: SignUpEventSchema },
        ],
      },
    ]),
  ],
  [
    'forFeatureAsync',
    MongooseModule.forFeatureAsync([
      {
        name: Event.name,
        useFactory: async () => EventSchema,
        discriminators: [
          { name: ClickLinkEvent.name, schema: ClieckLinkEventSchema },
          { name: SignUpEvent.name, schema: SignUpEventSchema },
        ],
      },
    ]),
  ],
];

describe.each(testCase)('Discriminator - %s', (_, features) => {
  let server: Server;
  let app: INestApplication;

  const mongoDbTestkit = new MongoDbTestkit();

  beforeAll(async () => {
    await mongoDbTestkit.start();
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          imports: [ConnectionModule],
          inject: [ConnectionService],
          useFactory: async (connectionService: ConnectionService) => {
            return {
              uri: connectionService.getConnectionOptions(),
            };
          },
        }),
        EventModule.forFeature(features),
      ],
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

  afterEach(async () => {
    await app.close();
  });

  it(`should return click-link document`, async () => {
    const createDto = { url: 'http://google.com' };
    const response = await request(server).post('/event/click-link').send(createDto);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject({
      ...createDto,
      kind: expect.any(String),
      time: expect.any(String),
    });
  });

  it(`should return sign-up document`, async () => {
    const createDto = { user: 'testuser' };
    const response = await request(server).post('/event/sign-up').send(createDto);
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toMatchObject({
      ...createDto,
      kind: expect.any(String),
      time: expect.any(String),
    });
  });

  test.each`
    path            | payload
    ${'click-link'} | ${{ testing: 1 }}
    ${'sign-up'}    | ${{ testing: 1 }}
  `(`document ($path) should not be created`, async ({ path, payload }) => {
    const response = await request(server).post(`/event/${path}`).send(payload);
    expect(response.error).toBeInstanceOf(Error);
    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});

import { Module } from '@nestjs/common';
import { MongooseModule } from '../../src';
import { CatsModule } from './cats/cats.module';
import { CatModule } from './cats/cat.module';
import { ConnectionModule } from './connection/connection.module';
import { ConnectionService } from './connection/connection.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CatOwnerInterceptor } from './cats/cat-owner.interceptor';

@Module({
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
    CatsModule,
    CatModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CatOwnerInterceptor,
    },
  ],
})
export class AppModule {}

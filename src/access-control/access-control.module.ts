import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { EnrichmentsService } from './enrichments.service';
import { runWithCtx } from './enrichments-async-store.provider';

@Module({
  providers: [EnrichmentsService],
  exports: [EnrichmentsService],
})
export class AccessControlModule implements NestModule {
  constructor() {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((_req: unknown, _res: unknown, next: () => void) => {
        runWithCtx(async () => next(), {
          global: {},
        });
      })
      .forRoutes('*');
  }
}

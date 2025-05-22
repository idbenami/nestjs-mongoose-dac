import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { EnrichmentsService } from '../../../src/access-control/enrichments.service';
import { Observable } from 'rxjs';

@Injectable()
export class CatOwnerInterceptor implements NestInterceptor {
  constructor(private readonly enrichmentsService: EnrichmentsService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();

    const ownerId = request.headers.cookie
      ?.split('; ')
      .find((row) => row.startsWith('ownerId='))
      ?.split('=')[1];

    this.enrichmentsService.setGlobalEnrichment('ownerId', ownerId);

    return next.handle();
  }
}

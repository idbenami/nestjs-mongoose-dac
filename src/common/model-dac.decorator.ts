import { Inject } from '@nestjs/common';
import { getModelToken } from './utils';

/**
 * @publicApi
 */
export const InjectModel = (model: string, connectionName?: string) =>
  Inject(getModelToken(model, connectionName));

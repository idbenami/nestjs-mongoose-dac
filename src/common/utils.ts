import { getConnectionToken } from '@nestjs/mongoose/dist/common/mongoose.utils';

/**
 * @publicApi
 */
export function getModelToken(model: string, connectionName?: string) {
  if (connectionName === undefined) {
    return `${model}ModelDAC`;
  }
  return `${getConnectionToken(connectionName)}/${model}ModelDAC`;
}

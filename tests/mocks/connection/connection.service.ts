import { Injectable } from '@nestjs/common';

@Injectable()
export class ConnectionService implements IConnectionService {
  constructor() {}

  getConnectionOptions(): string {
    return 'mongodb://localhost:27017/test';
  }
}

export interface IConnectionService {
  getConnectionOptions(tenant: string): string;
}

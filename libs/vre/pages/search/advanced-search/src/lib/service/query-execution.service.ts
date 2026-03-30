import { Injectable, signal } from '@angular/core';

@Injectable()
export class QueryExecutionService {
  queryIsExecuting = signal(false);
}

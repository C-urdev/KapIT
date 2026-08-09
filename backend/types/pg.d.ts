declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string;
    host?: string;
    port?: number | string;
    database?: string;
    user?: string;
    password?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export interface QueryResultRow {
    [column: string]: unknown;
  }

  export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
    rows: R[];
    rowCount: number | null;
  }

  export interface PoolClient {
    query<R extends QueryResultRow = QueryResultRow>(queryText: string, values?: readonly unknown[]): Promise<QueryResult<R>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<R extends QueryResultRow = QueryResultRow>(queryText: string, values?: readonly unknown[]): Promise<QueryResult<R>>;
    connect(): Promise<PoolClient>;
    on(event: 'connect', listener: () => void): this;
    on(event: 'error', listener: (error: NodeJS.ErrnoException) => void): this;
  }
}

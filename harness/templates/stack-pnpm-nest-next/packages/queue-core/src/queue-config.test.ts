import { describe, expect, it } from 'vitest';
import { loadQueueConfig, parseRedisConnection } from './queue-config';

describe('parseRedisConnection', () => {
  it('parses host/port/db from a REDIS_URL', () => {
    const conn = parseRedisConnection('redis://localhost:6380/2');
    expect(conn).toMatchObject({ host: 'localhost', port: 6380, db: 2, maxRetriesPerRequest: null });
  });

  it('parses credentials when present', () => {
    const conn = parseRedisConnection('redis://user:pass@cache.internal:6379');
    expect(conn).toMatchObject({ host: 'cache.internal', port: 6379, username: 'user', password: 'pass' });
  });

  it('defaults to port 6379 and no db when not specified', () => {
    const conn = parseRedisConnection('redis://cache.internal');
    expect(conn.port).toBe(6379);
    expect(conn.db).toBeUndefined();
  });
});

describe('loadQueueConfig', () => {
  it('defaults REDIS_URL when unset', () => {
    const config = loadQueueConfig({});
    expect(config.REDIS_URL).toBe('redis://localhost:6379');
  });

  it('passes through an explicit REDIS_URL', () => {
    const config = loadQueueConfig({ REDIS_URL: 'redis://redis:6379' });
    expect(config.REDIS_URL).toBe('redis://redis:6379');
  });
});

export interface CacheSetParams {
  key: string;
  value: unknown;
  ttlSeconds?: number;
}

export interface CacheGetParams {
  key: string;
}

export interface CacheGetOrSetParams<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttlSeconds?: number;
}

export interface CacheDelParams {
  key: string;
}

export interface CacheInvalidatePatternParams {
  pattern: string;
}

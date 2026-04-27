export interface GuardArgs {
  condition: boolean;
  message: string;
}

export interface ExistsArgs<T> {
  value: T | null | undefined;
  message: string;
}

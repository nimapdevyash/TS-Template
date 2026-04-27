import * as Errors from '@/utils/errors/index.js';
import type { ExistsArgs, GuardArgs } from '@/utils/interfaces/error.js';

// Uses static methods to act as logic guards.
export class Assert {
  static badRequest({ condition, message }: GuardArgs): void {
    if (condition) throw new Errors.BadRequestError(message);
  }

  static notFound({ condition, message }: GuardArgs): void {
    if (condition) throw new Errors.NotFoundError(message);
  }

  static conflict({ condition, message }: GuardArgs): void {
    if (condition) throw new Errors.ConflictError(message);
  }

  static forbidden({ condition, message }: GuardArgs): void {
    if (condition) throw new Errors.ForbiddenError(message);
  }

  //NOTE: We avoid destructuring here so TypeScript can narrow the 'value' type correctly.
  // Throw Error if Value Doesn't Exists
  static exists<T>(
    args: ExistsArgs<T>,
  ): asserts args is { value: T; message: string } {
    if (args.value === null || args.value === undefined) {
      throw new Errors.NotFoundError(args.message);
    }
  }
}

import * as Errors from '@/utils/errors/index.js';
import type { ExistsArgs, GuardArgs } from '@/utils/interfaces/error.js';

/**
 * Static assertion guards that throw typed `AppError` subclasses.
 * Use these instead of inline `if + throw` blocks to keep service
 * and controller code declarative and readable.
 *
 * @example
 * Assert.notFound({ condition: !user, message: 'User not found' });
 * Assert.exists({ value: user, message: 'User not found' });
 * Assert.conflict({ condition: emailTaken, message: 'Email already in use' });
 */
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

  static unauthorized({ condition, message }: GuardArgs): void {
    if (condition) throw new Errors.UnauthorizedError(message);
  }

  /**
   * Narrows `value` to `T`, throwing `NotFoundError` if it is
   * `null` or `undefined`.
   *
   * NOTE: We intentionally avoid destructuring so TypeScript can
   * narrow `args.value` correctly via the assertion signature.
   */
  static exists<T>(args: ExistsArgs<T>): asserts args is { value: T; message: string } {
    if (args.value === null || args.value === undefined) {
      throw new Errors.NotFoundError(args.message);
    }
  }
}

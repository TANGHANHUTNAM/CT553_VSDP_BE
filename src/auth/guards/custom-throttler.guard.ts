import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const {
      context,
      limit,
      ttl,
      throttler,
      blockDuration,
      getTracker,
      generateKey,
    } = requestProps;
    const type = context.getType();
    if (type !== 'http') {
      // Bỏ qua throttling cho non-HTTP contexts (e.g., RabbitMQ)
      return true;
    }
    return super.handleRequest(requestProps);
  }
}

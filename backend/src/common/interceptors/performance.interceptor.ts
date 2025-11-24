import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = request.user?.id || 'anonymous';

    const now = Date.now();
    const startMemory = process.memoryUsage();

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          const endMemory = process.memoryUsage();
          const memoryDelta = {
            heapUsed: ((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2),
            external: ((endMemory.external - startMemory.external) / 1024 / 1024).toFixed(2),
          };

          // Log slow requests (> 1s)
          if (responseTime > 1000) {
            this.logger.warn(
              `SLOW REQUEST: ${method} ${url} - ${responseTime}ms - User: ${userId} - IP: ${ip} - Memory: +${memoryDelta.heapUsed}MB`,
            );
          } else if (responseTime > 500) {
            this.logger.debug(
              `${method} ${url} - ${responseTime}ms - User: ${userId} - Memory: +${memoryDelta.heapUsed}MB`,
            );
          }

          // Log to metrics (can be sent to Prometheus, DataDog, etc.)
          this.recordMetrics({
            method,
            url,
            responseTime,
            userId,
            memoryDelta: parseFloat(memoryDelta.heapUsed),
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `ERROR: ${method} ${url} - ${responseTime}ms - User: ${userId} - Error: ${error.message}`,
          );
        },
      }),
    );
  }

  private recordMetrics(metrics: any) {
    // This can be extended to send metrics to:
    // - Prometheus
    // - DataDog
    // - New Relic
    // - CloudWatch
    // - Custom metrics database

    // For now, just log metrics that can be parsed
    if (metrics.responseTime > 100) {
      // Only log significant requests
      console.log(JSON.stringify({
        type: 'performance_metric',
        ...metrics,
      }));
    }
  }
}

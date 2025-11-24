import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export const REQUIRES_FEATURE_KEY = 'requires_feature';
export const REQUIRES_PLAN_KEY = 'requires_plan';

/**
 * Guard to check if user's subscription has required features
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  constructor(
    private reflector: Reflector,
    // @InjectRepository(Subscription)
    // private subscriptionRepository: Repository<Subscription>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<string>(
      REQUIRES_FEATURE_KEY,
      context.getHandler(),
    );
    const requiredPlan = this.reflector.get<string>(
      REQUIRES_PLAN_KEY,
      context.getHandler(),
    );

    if (!requiredFeature && !requiredPlan) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      // Get user's subscription
      // const subscription = await this.subscriptionRepository.findOne({
      //   where: { userId: user.id, status: 'active' },
      //   relations: ['plan'],
      // });

      // Mock for now - replace with actual subscription check
      const subscription = {
        plan: {
          tier: 'pro',
          features: {
            scormSupport: true,
            webinars: true,
            whiteLabel: true,
            sso: false,
            api: true,
          },
        },
      };

      if (!subscription) {
        throw new ForbiddenException('Active subscription required');
      }

      // Check feature access
      if (requiredFeature) {
        const hasFeature = subscription.plan.features[requiredFeature];
        if (!hasFeature) {
          throw new ForbiddenException(
            `This feature requires a subscription with ${requiredFeature}`,
          );
        }
      }

      // Check plan tier
      if (requiredPlan) {
        const planHierarchy = ['free', 'basic', 'pro', 'business', 'enterprise'];
        const userPlanIndex = planHierarchy.indexOf(subscription.plan.tier);
        const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);

        if (userPlanIndex < requiredPlanIndex) {
          throw new ForbiddenException(
            `This feature requires ${requiredPlan} plan or higher`,
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Subscription check failed: ${error.message}`);
      throw new ForbiddenException('Failed to verify subscription');
    }
  }
}

/**
 * Decorator to require a specific feature
 */
export const RequiresFeature = (feature: string) => {
  return SetMetadata(REQUIRES_FEATURE_KEY, feature);
};

/**
 * Decorator to require a minimum plan tier
 */
export const RequiresPlan = (plan: string) => {
  return SetMetadata(REQUIRES_PLAN_KEY, plan);
};

function SetMetadata(key: string, value: any) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(key, value, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(key, value, target);
    return target;
  };
}

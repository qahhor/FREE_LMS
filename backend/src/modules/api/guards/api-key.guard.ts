import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { OrganizationService } from '../../organizations/services/organization.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private organizationService: OrganizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const apiKey = request.headers['x-api-key'];
    const apiSecret = request.headers['x-api-secret'];

    if (!apiKey || !apiSecret) {
      throw new UnauthorizedException('API key and secret required');
    }

    try {
      const organization = await this.organizationService.verifyApiKey(apiKey, apiSecret);

      // Attach organization to request
      request.organization = organization;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid API credentials');
    }
  }
}

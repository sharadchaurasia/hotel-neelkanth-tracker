import { Controller, Get, Query, ForbiddenException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

@Controller('api/audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (user.role !== 'admin' && user.role !== 'super_admin') throw new ForbiddenException('Admin only');
    return this.auditService.findAll({
      userId: userId ? parseInt(userId) : undefined,
      entityType,
      from,
      to,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }
}

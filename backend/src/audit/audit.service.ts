import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async log(entry: {
    userId?: number;
    userName?: string;
    action: string;
    entityType: string;
    entityId?: string;
    description?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
  }) {
    try {
      const log = this.auditRepo.create(entry);
      await this.auditRepo.save(log);
    } catch (err) {
      console.error('Audit log failed:', err.message);
    }
  }

  async findAll(query: {
    userId?: number;
    entityType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.entityType) where.entityType = query.entityType;
    if (query.from && query.to) {
      where.createdAt = Between(new Date(query.from), new Date(query.to + 'T23:59:59'));
    } else if (query.from) {
      where.createdAt = MoreThanOrEqual(new Date(query.from));
    } else if (query.to) {
      where.createdAt = LessThanOrEqual(new Date(query.to + 'T23:59:59'));
    }

    const page = query.page || 1;
    const limit = query.limit || 50;

    const [data, total] = await this.auditRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }
}

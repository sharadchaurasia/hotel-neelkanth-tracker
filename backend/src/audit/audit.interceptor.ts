import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!['POST', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const url: string = request.url;
    if (url.startsWith('/api/auth/')) {
      return next.handle();
    }

    const user = request.user;

    return next.handle().pipe(
      tap((responseData) => {
        this.auditService.log({
          userId: user?.id,
          userName: user?.name,
          action: this.mapAction(method, url),
          entityType: this.extractEntityType(url),
          entityId: this.extractEntityId(url) || responseData?.id?.toString() || responseData?.bookingId,
          description: this.buildDescription(method, url, request.body, responseData),
          newValue: method !== 'DELETE' ? request.body : undefined,
          ipAddress: request.headers['x-real-ip'] || request.headers['x-forwarded-for'] || request.ip,
        });
      }),
    );
  }

  private extractEntityType(url: string): string {
    if (url.includes('/bookings')) return 'booking';
    if (url.includes('/daybook')) return 'daybook';
    if (url.includes('/staff') && !url.includes('/attendance') && !url.includes('/advances')) return 'staff';
    if (url.includes('/attendance')) return 'attendance';
    if (url.includes('/advances')) return 'salary_advance';
    if (url.includes('/users')) return 'user';
    return 'unknown';
  }

  private extractEntityId(url: string): string | null {
    const match = url.match(/\/(\d+)/);
    return match ? match[1] : null;
  }

  private mapAction(method: string, url: string): string {
    if (url.includes('/collect')) return 'COLLECT_PAYMENT';
    if (url.includes('/checkin')) return 'CHECKIN';
    if (url.includes('/checkout')) return 'CHECKOUT';
    if (url.includes('/cancel')) return 'CANCEL';
    if (url.includes('/reschedule')) return 'RESCHEDULE';
    if (url.includes('/fnf')) return 'FNF';
    if (url.includes('/auto-collect')) return 'AUTO_COLLECT';
    if (url.includes('/reset-password')) return 'RESET_PASSWORD';
    if (method === 'POST') return 'CREATE';
    if (method === 'PUT') return 'UPDATE';
    if (method === 'DELETE') return 'DELETE';
    return method;
  }

  private buildDescription(method: string, url: string, body: any, response: any): string {
    const entityType = this.extractEntityType(url);
    const id = this.extractEntityId(url) || response?.bookingId || response?.id;
    const action = this.mapAction(method, url);

    switch (action) {
      case 'COLLECT_PAYMENT':
        return `Payment collected: ₹${body?.amount || '?'} for ${entityType} #${id}`;
      case 'CHECKIN':
        return `Guest checked in to room ${body?.roomNo || '?'}`;
      case 'CHECKOUT':
        return `Guest checked out. KOT: ₹${body?.kotAmount || 0}`;
      case 'CANCEL':
        return `Booking #${id} cancelled`;
      case 'RESCHEDULE':
        return `Booking #${id} rescheduled to ${body?.newCheckOut || '?'}`;
      case 'CREATE':
        if (entityType === 'booking') return `New booking created: ${body?.guestName || ''}`;
        if (entityType === 'daybook') return `Daybook entry: ${body?.type} ₹${body?.amount || 0} - ${body?.category || ''}`;
        if (entityType === 'staff') return `New staff added: ${body?.name || ''}`;
        if (entityType === 'user') return `New user created: ${body?.name || ''}`;
        return `Created ${entityType}`;
      case 'UPDATE':
        if (entityType === 'booking') return `Booking #${id} updated`;
        if (entityType === 'staff') return `Staff #${id} updated`;
        if (entityType === 'user') return `User #${id} updated`;
        return `Updated ${entityType} #${id}`;
      case 'DELETE':
        return `Deleted ${entityType} #${id}`;
      default:
        return `${action} on ${entityType} #${id}`;
    }
  }
}

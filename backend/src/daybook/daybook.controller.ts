import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, ForbiddenException } from '@nestjs/common';
import { DaybookService } from './daybook.service';
import { CreateDaybookEntryDto, SetBalanceDto } from './dto/create-daybook.dto';
import { RequirePermissions, CurrentUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

@Controller('api/daybook')
export class DaybookController {
  constructor(private readonly daybookService: DaybookService) {}

  @Get('entries')
  @RequirePermissions('daybook', 'view')
  getEntries(@Query('date') date: string) {
    return this.daybookService.getEntries(date);
  }

  @Post('entries')
  @RequirePermissions('daybook', 'create')
  createEntry(@Body() dto: CreateDaybookEntryDto, @CurrentUser() user: User) {
    return this.daybookService.createEntry(dto, user.id, user.role, user.name);
  }

  @Patch('entries/:id')
  @RequirePermissions('daybook', 'edit')
  updateEntry(
    @Param('id') id: string,
    @Body() body: { paymentMode?: string; receivedIn?: string; paymentSource?: string; amount?: number; description?: string },
    @CurrentUser() user: User,
  ) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can edit daybook entries');
    }
    return this.daybookService.updateEntry(+id, body, user.id, user.role);
  }

  @Delete('entries/:id')
  @RequirePermissions('daybook', 'delete')
  deleteEntry(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can delete daybook entries');
    }
    return this.daybookService.deleteEntry(+id, user.id, user.role);
  }

  @Get('balance')
  @RequirePermissions('daybook', 'view')
  getBalance(@Query('date') date: string) {
    return this.daybookService.getBalance(date);
  }

  @Put('balance')
  @RequirePermissions('daybook', 'edit')
  setBalance(@Body() dto: SetBalanceDto, @CurrentUser() user: User) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can set opening balance');
    }
    return this.daybookService.setBalance(dto, user.id, user.role);
  }

  @Get('closing')
  @RequirePermissions('daybook', 'view')
  getClosing(@Query('date') date: string) {
    return this.daybookService.getClosing(date);
  }

  @Post('auto-collect')
  @RequirePermissions('daybook', 'create')
  autoCollect(@Query('date') date: string, @CurrentUser() user: User) {
    return this.daybookService.autoCollect(date, user.id, user.role);
  }

  // Access request endpoints
  @Get('check-access')
  @RequirePermissions('daybook', 'view')
  checkAccess(@Query('date') date: string, @CurrentUser() user: User) {
    return this.daybookService.checkAccess(user.id, user.role, date);
  }

  @Post('access-request')
  @RequirePermissions('daybook', 'view')
  requestAccess(@Body() body: { date: string; reason?: string }, @CurrentUser() user: User) {
    return this.daybookService.requestAccess(user.id, user.name, body.date, body.reason);
  }

  @Get('access-requests')
  @RequirePermissions('daybook', 'view')
  getAccessRequests(@CurrentUser() user: User) {
    if (user.role === 'admin' || user.role === 'super_admin') {
      return this.daybookService.getAllRequests();
    }
    return [];
  }

  @Get('pending-requests')
  @RequirePermissions('daybook', 'view')
  getPendingRequests(@CurrentUser() user: User) {
    if (user.role === 'admin' || user.role === 'super_admin') {
      return this.daybookService.getPendingRequests();
    }
    return [];
  }

  @Put('access-requests/:id')
  @RequirePermissions('daybook', 'edit')
  respondToRequest(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'denied'; adminNote?: string },
    @CurrentUser() user: User,
  ) {
    return this.daybookService.respondToRequest(+id, body.status, user.id, user.name, body.adminNote);
  }
}

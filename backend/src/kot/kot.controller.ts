import { Controller, Get, Post, Delete, Param, Body, Query, ForbiddenException } from '@nestjs/common';
import { KotService } from './kot.service';
import { RequirePermissions, CurrentUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';

@Controller('api/kot')
export class KotController {
  constructor(private readonly kotService: KotService) {}

  @Post()
  @RequirePermissions('kot', 'create')
  create(
    @Body() dto: {
      orderDate?: string;
      customerName?: string;
      description: string;
      amount: number;
      paymentMode: string;
      subCategory?: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.kotService.create(dto, user.name);
  }

  @Get()
  @RequirePermissions('kot', 'view')
  findAll(@Query('date') date?: string) {
    return this.kotService.findAll(date);
  }

  @Delete(':id')
  @RequirePermissions('kot', 'delete')
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    if (user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admin can delete KOT orders');
    }
    return this.kotService.delete(+id);
  }
}

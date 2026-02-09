import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, CurrentUser } from './decorators';
import { User } from './entities/user.entity';
import {
  VerifyPasskeyDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResendOtpDto,
  CreateUserDto,
  UpdateUserDto,
} from './dto/auth.dto';

@Controller('api')
export class AuthController {
  constructor(private authService: AuthService) {}

  private assertAdmin(user: User) {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new ForbiddenException('Admin only');
    }
  }

  @Public()
  @Post('auth/verify-passkey')
  @HttpCode(200)
  verifyPasskey(@Body() dto: VerifyPasskeyDto) {
    return { valid: this.authService.verifyPasskey(dto.passkey) };
  }

  @Public()
  @Post('auth/login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.emailOrPhone, dto.password);
  }

  @Post('auth/change-password')
  @HttpCode(200)
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto.oldPassword, dto.newPassword);
  }

  @Public()
  @Post('auth/forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('auth/verify-otp')
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtpAndResetPassword(dto.userId, dto.code, dto.newPassword);
  }

  @Public()
  @Post('auth/resend-otp')
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.sendOtp(dto.userId);
  }

  @Get('auth/profile')
  getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  // User management (admin only)
  @Get('users')
  findAllUsers(@CurrentUser() user: User) {
    this.assertAdmin(user);
    return this.authService.findAllUsers();
  }

  @Post('users')
  createUser(@CurrentUser() user: User, @Body() dto: CreateUserDto) {
    this.assertAdmin(user);
    return this.authService.createUser(dto);
  }

  @Put('users/:id')
  updateUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    this.assertAdmin(user);
    return this.authService.updateUser(id, dto);
  }

  @Delete('users/:id')
  deleteUser(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (user.role !== 'super_admin') throw new ForbiddenException('Only super admin can delete users');
    return this.authService.deleteUser(id);
  }

  @Post('users/reset-all-passwords')
  @HttpCode(200)
  resetAllPasswords(@CurrentUser() user: User) {
    this.assertAdmin(user);
    return this.authService.resetAllPasswords();
  }

  @Post('users/:id/reset-password')
  @HttpCode(200)
  resetPassword(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { newPassword?: string },
  ) {
    this.assertAdmin(user);
    return this.authService.resetUserPassword(id, body?.newPassword);
  }
}

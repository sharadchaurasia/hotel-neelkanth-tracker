import { IsString, IsEmail, IsOptional, IsObject, IsBoolean, IsNumber, Matches } from 'class-validator';

export class VerifyPasskeyDto {
  @IsString()
  passkey: string;
}

export class LoginDto {
  @IsString()
  emailOrPhone: string;

  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'New password must be exactly 4 digits' })
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsString()
  email: string;
}

export class VerifyOtpDto {
  @IsNumber()
  userId: number;

  @IsString()
  code: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'Password must be exactly 4 digits' })
  newPassword: string;
}

export class ResendOtpDto {
  @IsNumber()
  userId: number;
}

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, string[]>;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, string[]>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { User } from './entities/user.entity';
import { Otp } from './entities/otp.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Otp) private otpRepo: Repository<Otp>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const smtpHost = this.configService.get('SMTP_HOST');
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(this.configService.get('SMTP_PORT', '587')),
        secure: false,
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });
    }
  }

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count === 0) {
      const hash = await bcrypt.hash('1234', 12);
      const admin = this.userRepo.create({
        name: 'Admin',
        email: this.configService.get('ADMIN_EMAIL', 'admin@hotel.com'),
        phone: '',
        role: 'admin',
        passwordHash: hash,
        mustChangePassword: true,
        isActive: true,
        permissions: {},
      });
      await this.userRepo.save(admin);
      console.log('Default admin created. Email:', admin.email, 'Default PIN: 1234');
    }
  }

  verifyPasskey(passkey: string): boolean {
    const appPasskey = this.configService.get('APP_PASSKEY', '7890');
    return passkey === appPasskey;
  }

  async login(emailOrPhone: string, password: string) {
    if (!emailOrPhone || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    const user = await this.userRepo.findOne({
      where: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.passwordHash) {
      throw new UnauthorizedException('Password not set. Contact admin.');
    }

    const valid = await bcrypt.compare(String(password), String(user.passwordHash));
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    return {
      token,
      user: this.sanitizeUser(user),
      mustChangePassword: user.mustChangePassword,
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    if (!oldPassword || !newPassword) {
      throw new BadRequestException('Old and new password are required');
    }
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(String(oldPassword), String(user.passwordHash));
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(String(newPassword), 12);
    user.mustChangePassword = false;
    await this.userRepo.save(user);
    return { success: true };
  }

  // Forgot password: send OTP to email
  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return { success: true, message: 'If that email exists, OTP has been sent.' };
    }
    await this.sendOtp(user.id);
    return { success: true, userId: user.id, message: 'OTP sent to your email.' };
  }

  async sendOtp(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpRepo.save(
      this.otpRepo.create({ userId, code, type: 'reset', expiresAt }),
    );

    if (this.transporter && user.email) {
      try {
        await this.transporter.sendMail({
          from: this.configService.get('SMTP_USER'),
          to: user.email,
          subject: 'Hotel Neelkanth CRM - Password Reset OTP',
          html: `
            <h2>Hotel Neelkanth CRM</h2>
            <p>Your OTP code is: <strong>${code}</strong></p>
            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          `,
        });
      } catch (err) {
        console.error('Failed to send OTP email:', err.message);
      }
    }

    console.log(`OTP for user ${user.email}: ${code}`);
    return { success: true };
  }

  async verifyOtpAndResetPassword(userId: number, code: string, newPassword: string) {
    if (!code || !newPassword) {
      throw new BadRequestException('OTP and new password are required');
    }
    const otp = await this.otpRepo.findOne({
      where: { userId, code, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) throw new BadRequestException('Invalid OTP');
    if (new Date() > otp.expiresAt) throw new BadRequestException('OTP expired');

    otp.used = true;
    await this.otpRepo.save(otp);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.passwordHash = await bcrypt.hash(String(newPassword), 12);
    user.mustChangePassword = false;
    await this.userRepo.save(user);

    const token = this.generateToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  // User management (admin only)
  async findAllUsers() {
    const users = await this.userRepo.find({ order: { createdAt: 'ASC' } });
    return users.map((u) => this.sanitizeUser(u));
  }

  async createUser(dto: { name: string; email: string; phone?: string; role?: string; permissions?: Record<string, string[]> }) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('User with this email already exists');

    const perms = this.stripProtectedPermissions(dto.permissions || {}, dto.role || 'staff');
    const hash = await bcrypt.hash('1234', 12);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone || '',
      role: dto.role || 'staff',
      passwordHash: hash,
      mustChangePassword: true,
      permissions: perms,
      isActive: true,
    });
    const saved = await this.userRepo.save(user);
    return this.sanitizeUser(saved);
  }

  async updateUser(id: number, dto: { name?: string; email?: string; phone?: string; role?: string; permissions?: Record<string, string[]>; isActive?: boolean }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.permissions !== undefined) {
      const role = dto.role ?? user.role;
      user.permissions = this.stripProtectedPermissions(dto.permissions, role);
    }
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    const saved = await this.userRepo.save(user);
    return this.sanitizeUser(saved);
  }

  async deleteUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin' || user.role === 'super_admin') throw new BadRequestException('Cannot delete admin user');
    await this.userRepo.remove(user);
    return { success: true };
  }

  async resetUserPassword(id: number, newPassword?: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Use provided password or default to 1234
    const tempPassword = newPassword || '1234';

    // Validate password is 4 digits
    if (!/^\d{4}$/.test(tempPassword)) {
      throw new BadRequestException('Password must be exactly 4 digits');
    }

    user.passwordHash = await bcrypt.hash(tempPassword, 12);
    user.mustChangePassword = true;
    await this.userRepo.save(user);
    return { success: true, tempPassword };
  }

  async resetAllPasswords() {
    const users = await this.userRepo.find();
    const tempPassword = '1234';
    const hash = await bcrypt.hash(tempPassword, 12);
    for (const user of users) {
      user.passwordHash = hash;
      user.mustChangePassword = true;
    }
    await this.userRepo.save(users);
    return { success: true, count: users.length, tempPassword };
  }

  // Only super_admin keeps delete permissions
  private stripProtectedPermissions(perms: Record<string, string[]>, role: string): Record<string, string[]> {
    if (role === 'super_admin') return perms;
    const result = { ...perms };
    if (result.bookings) {
      result.bookings = result.bookings.filter(p => p !== 'delete');
    }
    if (result.daybook) {
      result.daybook = result.daybook.filter(p => p !== 'delete');
    }
    return result;
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      role: user.role,
      name: user.name,
    });
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    };
  }
}

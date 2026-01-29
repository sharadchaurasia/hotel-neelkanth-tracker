import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './staff.entity';
import { Attendance } from './attendance.entity';
import { SalaryAdvance } from './salary-advance.entity';
import { CreateStaffDto, CreateAttendanceDto, CreateAdvanceDto, FnfDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(SalaryAdvance)
    private advanceRepo: Repository<SalaryAdvance>,
  ) {}

  private async generateStaffCode(): Promise<string> {
    const result = await this.staffRepo
      .createQueryBuilder('s')
      .select("MAX(CAST(SUBSTRING(s.staff_code FROM 5) AS INTEGER))", 'maxNum')
      .where("s.staff_code LIKE 'EMP-%'")
      .getRawOne();
    const next = (result?.maxNum || 0) + 1;
    return 'EMP-' + String(next).padStart(3, '0');
  }

  // Staff CRUD
  async findAllStaff(): Promise<Staff[]> {
    return this.staffRepo.find({ order: { createdAt: 'ASC' } });
  }

  async createStaff(dto: CreateStaffDto): Promise<Staff> {
    const staffCode = await this.generateStaffCode();
    const staff = this.staffRepo.create({
      staffCode,
      name: dto.name,
      designation: dto.designation,
      salary: dto.salary || 0,
      doj: dto.doj,
      status: 'active',
    });
    return this.staffRepo.save(staff);
  }

  async updateStaff(id: number, dto: Partial<CreateStaffDto>): Promise<Staff> {
    const staff = await this.staffRepo.findOne({ where: { id } });
    if (!staff) throw new NotFoundException('Staff not found');
    Object.assign(staff, dto);
    return this.staffRepo.save(staff);
  }

  async processFnf(id: number, dto: FnfDto): Promise<Staff> {
    const staff = await this.staffRepo.findOne({ where: { id } });
    if (!staff) throw new NotFoundException('Staff not found');

    staff.status = 'left';
    staff.lastWorkingDate = dto.lastWorkingDate;

    // Mark all pending advances as deducted
    await this.advanceRepo
      .createQueryBuilder()
      .update(SalaryAdvance)
      .set({ deducted: true })
      .where('staff_id = :id AND deducted = false', { id })
      .execute();

    return this.staffRepo.save(staff);
  }

  // Attendance
  async getAttendance(staffId: number, month: string): Promise<Attendance[]> {
    return this.attendanceRepo
      .createQueryBuilder('a')
      .where('a.staff_id = :staffId', { staffId })
      .andWhere("TO_CHAR(a.date, 'YYYY-MM') = :month", { month })
      .getMany();
  }

  async markAbsent(dto: CreateAttendanceDto): Promise<Attendance> {
    // Check if already exists
    const existing = await this.attendanceRepo.findOne({
      where: { staffId: dto.staffId, date: dto.date },
    });
    if (existing) {
      existing.absent = dto.absent ?? true;
      existing.remark = dto.remark || existing.remark;
      return this.attendanceRepo.save(existing);
    }
    const attendance = this.attendanceRepo.create({
      staffId: dto.staffId,
      date: dto.date,
      absent: dto.absent ?? true,
      remark: dto.remark,
    });
    return this.attendanceRepo.save(attendance);
  }

  async removeAbsence(staffId: number, date: string): Promise<void> {
    await this.attendanceRepo.delete({ staffId, date });
  }

  // Salary Advances
  async findAllAdvances(): Promise<SalaryAdvance[]> {
    return this.advanceRepo.find({
      relations: ['staff'],
      order: { date: 'DESC' },
    });
  }

  async createAdvance(dto: CreateAdvanceDto): Promise<SalaryAdvance> {
    const advance = this.advanceRepo.create({
      staffId: dto.staffId,
      amount: dto.amount,
      date: dto.date,
      deductMonth: dto.deductMonth,
      remarks: dto.remarks,
      deducted: false,
    });
    return this.advanceRepo.save(advance);
  }

  async deleteAdvance(id: number): Promise<void> {
    const advance = await this.advanceRepo.findOne({ where: { id } });
    if (!advance) throw new NotFoundException('Advance not found');
    await this.advanceRepo.remove(advance);
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { StaffService } from '../src/staff/staff.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../src/staff/staff.entity';
import { Attendance } from '../src/staff/attendance.entity';
import { SalaryAdvance } from '../src/staff/salary-advance.entity';

async function cleanupEmployees() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const staffRepo = app.get<Repository<Staff>>('StaffRepository');
  const attendanceRepo = app.get<Repository<Attendance>>('AttendanceRepository');
  const advanceRepo = app.get<Repository<SalaryAdvance>>('SalaryAdvanceRepository');

  const employeeCodes = [
    'EMP-011',
    'EMP-012',
    'EMP-013',
    'EMP-014',
    'EMP-015',
    'EMP-016',
    'EMP-017',
  ];

  console.log('='.repeat(60));
  console.log('EMPLOYEE CLEANUP SCRIPT');
  console.log('='.repeat(60));
  console.log('Target employees:', employeeCodes.join(', '));
  console.log('');

  let softDeleted = 0;
  let hardDeleted = 0;
  let notFound = 0;

  for (const code of employeeCodes) {
    console.log(`Processing ${code}...`);

    const staff = await staffRepo.findOne({ where: { staffCode: code } });

    if (!staff) {
      console.log(`  ❌ ${code} not found in database`);
      notFound++;
      continue;
    }

    // Check if linked to any data
    const attendanceCount = await attendanceRepo.count({
      where: { staffId: staff.id },
    });

    const advanceCount = await advanceRepo.count({
      where: { staffId: staff.id },
    });

    const hasData = attendanceCount > 0 || advanceCount > 0;

    if (hasData) {
      // Soft delete: set status = inactive
      staff.status = 'inactive';
      staff.lastWorkingDate = new Date().toISOString().split('T')[0];
      await staffRepo.save(staff);

      console.log(`  ✓ ${code} (${staff.name}) - SOFT DELETED`);
      console.log(`    - Attendance records: ${attendanceCount}`);
      console.log(`    - Salary advances: ${advanceCount}`);
      console.log(`    - Status: inactive`);
      softDeleted++;
    } else {
      // Hard delete: no references
      await staffRepo.remove(staff);

      console.log(`  ✓ ${code} (${staff.name}) - HARD DELETED`);
      console.log(`    - No linked data found`);
      console.log(`    - Permanently removed from database`);
      hardDeleted++;
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Soft deleted (set to inactive): ${softDeleted}`);
  console.log(`Hard deleted (removed): ${hardDeleted}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Total processed: ${softDeleted + hardDeleted + notFound}/${employeeCodes.length}`);
  console.log('');

  await app.close();
}

cleanupEmployees()
  .then(() => {
    console.log('✓ Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Cleanup failed:', error);
    process.exit(1);
  });

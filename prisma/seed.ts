/**
 * Prisma seed script for payroll app.
 * Run: npx ts-node prisma/seed.ts  (after installing dependencies and setting DATABASE_URL)
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding employees...');

  // Load the frontend seed data file
  const dataPath = path.resolve(__dirname, '../src/data/employees.ts');
  if (!fs.existsSync(dataPath)) {
    console.warn('Employee seed file not found at', dataPath);
    return;
  }

  // Import via dynamic evaluation to avoid TS transpile issues. The file exports `employees` array.
  const content = fs.readFileSync(dataPath, 'utf8');
  // Very small parser: find the array literal start `export const employees: Employee[] = [` and extract until closing `];`
  const match = content.match(/export const employees[\s\S]*?=\s*(\[([\s\S]*)\]);/m);
  if (!match) {
    console.warn('Could not parse employees.ts — falling back to empty seed');
    return;
  }
  const arrayLiteral = match[1];

  // Unsafe eval: wrap in module and eval to get the array. This keeps the original object shapes.
  const moduleCode = `const exports = {};\nmodule = { exports };\nreturn (function(){ ${content}; return exports.employees; })()`;
  // eslint-disable-next-line no-new-func
  const employees = new Function(moduleCode)();

  for (const emp of employees) {
    try {
      // Prefer upsert by unique email when present
      if (emp.email) {
        await prisma.employees.upsert({
          where: { email: emp.email },
          update: {
            name: emp.name,
            phone: emp.phone || null,
            position: emp.position || null,
            department: emp.department || null,
            join_date: emp.joinDate ? new Date(emp.joinDate) : null,
            base_salary: emp.baseSalary != null ? emp.baseSalary.toString() : undefined,
            overtime_rate: emp.overtimeRate != null ? emp.overtimeRate.toString() : undefined,
            is_management: emp.isManagement || false,
            religion: emp.religion || null,
            holiday_settings: emp.holidaySettings || null,
            allowances: emp.allowances || null,
            deductions: emp.deductions || null,
          },
          create: {
            name: emp.name,
            email: emp.email,
            phone: emp.phone || null,
            position: emp.position || null,
            department: emp.department || null,
            join_date: emp.joinDate ? new Date(emp.joinDate) : null,
            base_salary: emp.baseSalary != null ? emp.baseSalary.toString() : '0',
            overtime_rate: emp.overtimeRate != null ? emp.overtimeRate.toString() : '0',
            is_management: emp.isManagement || false,
            religion: emp.religion || null,
            holiday_settings: emp.holidaySettings || null,
            allowances: emp.allowances || null,
            deductions: emp.deductions || null,
          }
        });
        console.log('Upserted (email)', emp.email);
      } else {
        // Fallback upsert using a synthetic unique key: name + joinDate
        const syntheticKey = `${emp.name}::${emp.joinDate || ''}`;
        // Try to find existing by same name and joinDate
        const existing = await prisma.employees.findFirst({ where: { name: emp.name, join_date: emp.joinDate ? new Date(emp.joinDate) : undefined } });
        if (existing) {
          await prisma.employees.update({ where: { id: existing.id }, data: {
            phone: emp.phone || null,
            position: emp.position || null,
            department: emp.department || null,
            base_salary: emp.baseSalary != null ? emp.baseSalary.toString() : undefined,
            overtime_rate: emp.overtimeRate != null ? emp.overtimeRate.toString() : undefined,
            is_management: emp.isManagement || false,
            religion: emp.religion || null,
            holiday_settings: emp.holidaySettings || null,
            allowances: emp.allowances || null,
            deductions: emp.deductions || null,
          }});
          console.log('Updated (fallback)', emp.name);
        } else {
          await prisma.employees.create({ data: {
            name: emp.name,
            phone: emp.phone || null,
            position: emp.position || null,
            department: emp.department || null,
            join_date: emp.joinDate ? new Date(emp.joinDate) : null,
            base_salary: emp.baseSalary != null ? emp.baseSalary.toString() : '0',
            overtime_rate: emp.overtimeRate != null ? emp.overtimeRate.toString() : '0',
            is_management: emp.isManagement || false,
            religion: emp.religion || null,
            holiday_settings: emp.holidaySettings || null,
            allowances: emp.allowances || null,
            deductions: emp.deductions || null,
          }});
          console.log('Created (fallback)', emp.name);
        }
      }
    } catch (err) {
      console.error('Error upserting', emp.name, err);
    }
  }

  console.log('Seeding done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

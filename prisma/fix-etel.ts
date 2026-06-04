import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.stock.update({
    where: { ticker: 'ETEL' },
    data: { nameAr: 'الاتصالات المصرية' },
  });
  console.log('✅ ETEL Arabic name updated');
}
main().catch(console.error).finally(() => prisma.$disconnect());

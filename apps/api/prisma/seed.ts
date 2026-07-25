import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.allowedDomain.upsert({
    where: { domain: "bvmengineering.ac.in" },
    create: {
      domain: "bvmengineering.ac.in",
      collegeName: "BVM Engineering College",
      isActive: true,
    },
    update: {},
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

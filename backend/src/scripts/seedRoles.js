require("dotenv").config();
const prisma = require("../prisma");

async function main() {
  const roles = ["student", "teacher", "proctor", "admin"];
  for (const name of roles) {
    await prisma.auth_role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Roles seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
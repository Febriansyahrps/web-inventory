// prisma/seed.ts — optional seed for Task 6
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  for (const name of ["ADMIN", "VIEWER"]) {
    const exists = await prisma.role.findFirst({ where: { name } });
    if (!exists) {
      await prisma.role.create({ data: { name } });
      console.log("Role created:", name);
    } else {
      console.log("Role exists:", name);
    }
  }

  const adminRole = (await prisma.role.findFirst({
    where: { name: "ADMIN" },
  }))!;

  // Default admin user — only seed when the user table is empty
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const hashed = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        idRole: adminRole.id,
        username: "admin",
        password: hashed,
        fullname: "Administrator",
      },
    });
    console.log("Admin user created:", admin.username);
  } else {
    console.log(
      "User table not empty — skipping admin seed:",
      userCount,
      "user(s)",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

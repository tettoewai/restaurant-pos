import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { ensureDefaultTenant } from "@/lib/default-tenant";

const datasourceUrl = process.env.DATABASE_URL;
if (!datasourceUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: datasourceUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("Starting seed script...");

  await ensureDefaultTenant({
    prisma,
    user: {
      email: "owner@auroradining.io",
      name: "Aurora Demo Owner",
    },
  });

  console.log("Database seeded with demo data.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

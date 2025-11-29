import { prisma } from "@/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const health: {
    status: "healthy" | "unhealthy";
    timestamp: string;
    uptime: number;
    database: "connected" | "disconnected";
    responseTime: number;
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "disconnected",
    responseTime: 0,
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.database = "connected";
  } catch (error) {
    health.status = "unhealthy";
    health.database = "disconnected";
  }

  health.responseTime = Date.now() - startTime;

  return NextResponse.json(health, {
    status: health.status === "healthy" ? 200 : 503,
  });
}

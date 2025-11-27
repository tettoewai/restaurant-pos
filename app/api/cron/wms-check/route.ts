import { checkWMS } from "@/function";
import { prisma } from "@/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * API route for Vercel Cron to automatically check WMS
 * Scheduled to run at:
 * - 5:00 AM (morning check before opening)
 * - 2:00 PM (afternoon check during off-peak hours)
 * - 11:00 PM (night check after closing)
 *
 * Security: If CRON_SECRET is set in environment variables, requests must include
 * Authorization: Bearer <CRON_SECRET> header. If not set, the endpoint will still work
 * but is less secure (recommended for production: set CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  try {
    // Optional security: Verify requests using CRON_SECRET
    // Note: Vercel Cron doesn't automatically send custom headers.
    // For additional security, you can:
    // 1. Use Next.js middleware to add authentication
    // 2. Add the secret to the URL path in vercel.json
    // 3. Or rely on endpoint obscurity (current default)
    if (process.env.CRON_SECRET) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn("[WMS Cron] Unauthorized request attempt");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log(
      `[WMS Cron] Starting automated WMS check at ${new Date().toISOString()}`
    );

    // Run the WMS check
    const result = await checkWMS();

    // Calculate total issues
    const issuesCount =
      result.menusWithoutIngredients.length +
      result.addonsWithoutIngredients.length +
      result.notEnoughIngredients.length +
      result.hitThresholdStocks.length;

    console.log(`[WMS Cron] Check completed. Issues found: ${issuesCount}`);
    console.log(`[WMS Cron] Details:`, {
      menusWithoutIngredients: result.menusWithoutIngredients.length,
      addonsWithoutIngredients: result.addonsWithoutIngredients.length,
      notEnoughIngredients: result.notEnoughIngredients.length,
      hitThresholdStocks: result.hitThresholdStocks.length,
    });

    // Only create notification and store result if there are issues
    if (issuesCount > 0) {
      try {
        // Store WMS check result
        // Note: After running migration, Prisma will generate the client with the correct model name
        const wmsCheckResult = await (prisma as any).wMSCheckResult.create({
          data: {
            menusWithoutIngredients: JSON.parse(
              JSON.stringify(result.menusWithoutIngredients)
            ),
            addonsWithoutIngredients: JSON.parse(
              JSON.stringify(result.addonsWithoutIngredients)
            ),
            notEnoughIngredients: JSON.parse(
              JSON.stringify(result.notEnoughIngredients)
            ),
            hitThresholdStocks: JSON.parse(
              JSON.stringify(result.hitThresholdStocks)
            ),
            issuesCount,
          },
        });

        // Create notification for all users (warehouse staff should see this)
        // We'll create a notification without tableId for WMS checks
        const notificationMessage = `WMS Check: ${issuesCount} issue${
          issuesCount > 1 ? "s" : ""
        } found in warehouse management system`;

        // Note: After running migration, Prisma will generate the correct types
        await (prisma.notification.create as any)({
          data: {
            message: notificationMessage,
            type: "WMS_CHECK",
            wmsCheckResultId: wmsCheckResult.id,
            // tableId is optional, so we don't need to set it
          },
        });

        console.log(
          `[WMS Cron] Notification created for ${issuesCount} issues`
        );
      } catch (error) {
        console.error("[WMS Cron] Error creating notification:", error);
        // Don't fail the entire request if notification creation fails
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      issuesCount,
      notificationCreated: issuesCount > 0,
      details: {
        menusWithoutIngredients: result.menusWithoutIngredients.length,
        addonsWithoutIngredients: result.addonsWithoutIngredients.length,
        notEnoughIngredients: result.notEnoughIngredients.length,
        hitThresholdStocks: result.hitThresholdStocks.length,
      },
    });
  } catch (error) {
    console.error("[WMS Cron] Error during WMS check:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}


export async function register() {
    // A production build must not require a live database connection.
    if (process.env.NEXT_PHASE === "phase-production-build") {
        console.info("[BOOT] Skipping runtime service initialization during production build.");
        return;
    }

    if (process.env.NEXT_RUNTIME !== "nodejs") {
        return;
    }

    console.info("----------------------------------------");
    console.info("[BOOT] Local Discovery Platform");
    console.info(`[BOOT] Environment: ${process.env.NODE_ENV}`);
    console.info("[BOOT] Initializing backend services...");

    try {
        const { connectDB } = await import("./lib/db.js");
        await connectDB();

        console.info(
            `[AUTH] JWT secret configured: ${Boolean(process.env.JWT_SECRET) ? "yes" : "no"
            }`
        );

        console.info("[BOOT] Backend initialization complete");
    } catch (error) {
        console.error(
            "[BOOT] Initialization failed:",
            error.message
        );

        throw error;
    }
}


export async function register() {
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


import { getAuthenticatedUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api/response";

export async function requireAdmin() {
    try {
        const user = await getAuthenticatedUser();

        if (!user || user.role !== "admin") {
            return {
                user: null,
                response: apiError("Authentication required.", 401),
            };
        }

        return { user, response: null };
    } catch (error) {
        console.error("[AUTH] Admin authorization failed:", error.message);

        return {
            user: null,
            response: apiError("Unable to verify authorization.", 500),
        };
    }
}

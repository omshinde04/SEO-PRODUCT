
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
    try {
        const connection = await connectDB();

        return NextResponse.json(
            {
                success: true,
                message: "MongoDB connection successful",
                data: {
                    database: connection.name,
                    readyState: connection.readyState,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Database health check failed:", error.message);

        return NextResponse.json(
            {
                success: false,
                message: "Database connection failed",
            },
            { status: 503 }
        );
    }
}

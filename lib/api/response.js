
import { NextResponse } from "next/server";

export function apiSuccess(data, status = 200) {
    return NextResponse.json(
        { success: true, ...data },
        {
            status,
            headers: { "Cache-Control": "no-store" },
        }
    );
}

export function apiError(message, status = 500, details) {
    const body = {
        success: false,
        message,
    };

    if (details !== undefined) {
        body.details = details;
    }

    return NextResponse.json(body, {
        status,
        headers: { "Cache-Control": "no-store" },
    });
}

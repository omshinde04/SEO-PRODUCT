
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
  })
  .strict();

function jsonError(message, status) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonError("Content-Type must be application/json.", 415);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON request body.", 400);
    }

    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return jsonError("Please provide a valid email and password.", 400);
    }

    const email = validation.data.email.toLowerCase();
    const password = validation.data.password;

    await connectDB();

    const user = await User.findOne({ email })
      .select("+password name email role isActive tokenVersion")
      .exec();

    // Use the same public error for an unknown email and wrong password.
    if (!user || user.role !== "admin") {
      return jsonError("Invalid email or password.", 401);
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches || !user.isActive) {
      return jsonError("Invalid email or password.", 401);
    }

    await createSession(user);

    return NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    // Keep credentials, JWTs, and request bodies out of logs.
    console.error("[AUTH] Login request failed:", error.message);

    return jsonError("Unable to process login right now.", 500);
  }
}


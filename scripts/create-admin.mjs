import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import passwordPrompt from "password-prompt";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Load environment variables before importing application models.
dotenv.config({ path: ".env.local" });

async function createAdmin() {
    let rl;
    let connected = false;

    try {
        // Validate environment configuration.
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from .env.local");
        }

        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            throw new Error("JWT_SECRET must contain at least 32 characters.");
        }

        // Import the model after loading environment variables.
        const { default: User } = await import("../models/User.js");

        rl = readline.createInterface({ input, output });

        const name = (await rl.question("Admin name: ")).trim();
        const email = (
            await rl.question("Admin email: ")
        ).trim().toLowerCase();

        // Close readline before starting the hidden password prompt.
        rl.close();
        rl = undefined;

        if (name.length < 2 || name.length > 100) {
            throw new Error("Name must contain between 2 and 100 characters.");
        }

        if (
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            throw new Error("Please enter a valid email address.");
        }

        console.log("Enter your admin password below.");

        // The password is hidden while typing.
        const password = await passwordPrompt("Admin password: ", {
            method: "hide",
        });

        if (typeof password !== "string" || password.length < 12) {
            throw new Error("Password must contain at least 12 characters.");
        }

        if (password.length > 128) {
            throw new Error("Password cannot exceed 128 characters.");
        }

        const confirmation = await passwordPrompt(
            "Confirm admin password: ",
            { method: "hide" }
        );

        if (password !== confirmation) {
            throw new Error("Passwords do not match.");
        }

        // Connect to MongoDB.
        console.log("\nConnecting to MongoDB...");

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            bufferCommands: false,
        });

        connected = true;
        console.log("MongoDB connected.");

        // Create indexes before checking/creating the administrator.
        // This will fail if existing data conflicts with the indexes.
        await User.createIndexes();

        const existingAdmin = await User.findOne({ role: "admin" })
            .select("_id")
            .lean();

        if (existingAdmin) {
            throw new Error(
                "An admin already exists. Refusing to create another."
            );
        }

        const existingEmail = await User.findOne({ email })
            .select("_id")
            .lean();

        if (existingEmail) {
            throw new Error("This email address is already registered.");
        }

        // Hash the password; never store the plain-text password.
        const passwordHash = await bcrypt.hash(password, 12);

        await User.create({
            name,
            email,
            password: passwordHash,
            role: "admin",
            isActive: true,
            tokenVersion: 0,
        });

        console.log("\nAdmin account created successfully.");
        console.log(`Admin name: ${name}`);
        console.log(`Admin email: ${email}`);
        console.log("Password: hidden");
    } catch (error) {
        console.error("\nAdmin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        if (rl) {
            rl.close();
        }

        if (connected || mongoose.connection.readyState !== 0) {
            await mongoose.disconnect().catch(() => { });
        }
    }
}

await createAdmin();
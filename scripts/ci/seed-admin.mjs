import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../../models/User.js";

const uri = process.env.TEST_MONGODB_URI;
const email = process.env.CI_ADMIN_EMAIL;
const password = process.env.CI_ADMIN_PASSWORD;

if (process.env.CI !== "true") {
    throw new Error("This seed script is only allowed in CI.");
}
if (!uri || new URL(uri).pathname.replace(/^\//, "") !== "seo_product_test") {
    throw new Error("TEST_MONGODB_URI must point to the isolated seo_product_test database.");
}
if (!email || !password || password.length < 12 || password.length > 128) {
    throw new Error("CI administrator credentials are missing or invalid.");
}

try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    if (mongoose.connection.name !== "seo_product_test") {
        throw new Error("Refusing to seed a database other than seo_product_test.");
    }

    await User.createIndexes();
    await User.deleteMany({});
    await User.create({
        name: "CI Administrator",
        email: email.toLowerCase(),
        password: await bcrypt.hash(password, 12),
        role: "admin",
        isActive: true,
        tokenVersion: 0,
    });

    process.stdout.write("Seeded isolated CI administrator.\n");
} finally {
    await mongoose.disconnect().catch(() => {});
}

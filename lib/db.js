
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable.");
}

const MONGODB_OPTIONS = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
};

const cacheKey = "__localDiscoveryMongoose";

const cached =
    globalThis[cacheKey] ||
    (globalThis[cacheKey] = {
        connection: null,
        promise: null,
    });

export async function connectDB() {
    if (cached.connection?.readyState === 1) {
        return cached.connection;
    }

    if (!cached.promise) {
        console.info("[DATABASE] Connecting to MongoDB...");

        cached.promise = mongoose
            .connect(MONGODB_URI, MONGODB_OPTIONS)
            .then((instance) => {
                const connection = instance.connection;

                cached.connection = connection;

                console.info("[DATABASE] Connected successfully");
                console.info(`[DATABASE] Database: ${connection.name}`);

                return connection;
            })
            .catch((error) => {
                cached.promise = null;
                cached.connection = null;

                console.error(
                    "[DATABASE] Connection failed:",
                    error.message
                );

                throw error;
            });
    }

    return cached.promise;
}

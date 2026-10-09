
import "server-only";
import { SignJWT, jwtVerify } from "jose";

const ISSUER = "local-discovery-platform";
const AUDIENCE = "local-discovery-admin";
const TOKEN_TTL_SECONDS = 15 * 60;

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error(
            "JWT_SECRET must be configured with a strong secret."
        );
    }

    return new TextEncoder().encode(secret);
}

export async function signAccessToken(user) {
    const secret = getJwtSecret();

    return new SignJWT({
        role: user.role,
        tokenVersion: user.tokenVersion,
    })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setSubject(user._id.toString())
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
        .sign(secret);
}

export async function verifyAccessToken(token) {
    const secret = getJwtSecret();

    const { payload, protectedHeader } = await jwtVerify(
        token,
        secret,
        {
            algorithms: ["HS256"],
            issuer: ISSUER,
            audience: AUDIENCE,
            requiredClaims: ["sub", "iat", "exp"],
            maxTokenAge: `${TOKEN_TTL_SECONDS}s`,
            clockTolerance: 5,
        }
    );

    if (
        protectedHeader.typ !== "JWT" ||
        typeof payload.sub !== "string" ||
        !["admin"].includes(payload.role) ||
        !Number.isInteger(payload.tokenVersion) ||
        payload.tokenVersion < 0
    ) {
        throw new Error("Invalid authentication token.");
    }

    return payload;
}

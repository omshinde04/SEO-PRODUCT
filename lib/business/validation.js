
import { z } from "zod";

const DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validate that a URL uses HTTP or HTTPS.
 */
const isHttpUrl = (value) => {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
};

/**
 * Optional URL:
 * - Empty string is allowed.
 * - Missing value is allowed when used with .optional().
 * - Non-empty values must be valid HTTP/HTTPS URLs.
 */
export const optionalUrlSchema = z
    .string()
    .trim()
    .max(2048)
    .refine(
        (value) => !value || isHttpUrl(value),
        "Enter a valid HTTP or HTTPS URL."
    );

/**
 * Required URL:
 * - Empty strings are rejected.
 * - Only valid HTTP/HTTPS URLs are accepted.
 */
export const requiredUrlSchema = z
    .string()
    .trim()
    .min(1, "URL is required.")
    .max(2048)
    .refine(
        isHttpUrl,
        "Enter a valid HTTP or HTTPS URL."
    );

/**
 * Validate a single opening period.
 * Overnight periods are not supported.
 */
export const openingPeriodSchema = z
    .object({
        open: z.string().regex(
            TIME_PATTERN,
            "Opening time must use HH:mm format."
        ),
        close: z.string().regex(
            TIME_PATTERN,
            "Closing time must use HH:mm format."
        ),
    })
    .strict()
    .refine(
        ({ open, close }) => open < close,
        {
            message:
                "Closing time must be later than opening time. Overnight hours are not supported.",
            path: ["close"],
        }
    );

/**
 * Validate weekly opening hours and reject overlapping periods.
 * Each day can contain up to 10 opening periods.
 */
export const weeklyHoursSchema = z
    .object(
        Object.fromEntries(
            DAYS.map((day) => [
                day,
                z.array(openingPeriodSchema).max(10).optional(),
            ])
        )
    )
    .strict()
    .superRefine((weekly, ctx) => {
        for (const day of DAYS) {
            const periods = weekly[day] ?? [];

            const sorted = periods
                .map((period, index) => ({
                    ...period,
                    index,
                }))
                .sort((a, b) => a.open.localeCompare(b.open));

            for (let i = 1; i < sorted.length; i += 1) {
                if (sorted[i].open < sorted[i - 1].close) {
                    ctx.addIssue({
                        code: "custom",
                        path: [day, sorted[i].index, "open"],
                        message: `Opening periods overlap on ${day}.`,
                    });
                }
            }
        }
    });

/**
 * Validate latitude and longitude after merging a partial update
 * with the currently stored coordinates.
 */
export function validateCoordinatePair(
    current = {},
    updates = {}
) {
    const latitude =
        updates.latitude !== undefined
            ? updates.latitude
            : current.latitude ?? null;

    const longitude =
        updates.longitude !== undefined
            ? updates.longitude
            : current.longitude ?? null;

    if ((latitude === null) !== (longitude === null)) {
        return "Latitude and longitude must both be provided, or both be null.";
    }

    return null;
}

/**
 * Validate the required fields before publishing a business.
 */
export function validatePublishedBusiness(business) {
    if (business.status !== "published") {
        return null;
    }

    if (!business.name?.trim()) {
        return "A published business must have a name.";
    }

    if (!business.description?.trim()) {
        return "A published business must have a description.";
    }

    if (!business.category || !business.location) {
        return "A published business must have a category and location.";
    }

    return null;
}

/**
 * Return structured validation errors for weekly opening hours,
 * or null when the schedule is valid.
 */
export function validateWeeklyHours(weekly = {}) {
    const result = weeklyHoursSchema.safeParse(weekly);

    if (result.success) {
        return null;
    }

    return result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
    }));
}

/**
 * Lightweight, zero-dependency User-Agent classifier.
 * Groups users into broad families (Mobile/Tablet/Desktop, Browser Family, OS Family).
 * Avoids any detailed or invasive fingerprinting.
 */

export function parseUserAgent(userAgentString) {
    if (!userAgentString || typeof userAgentString !== "string") {
        return {
            deviceType: "unknown",
            browserFamily: "Other",
            osFamily: "Other",
        };
    }

    const ua = userAgentString;

    // 1. Device Type
    let deviceType = "desktop";
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        deviceType = "tablet";
    } else if (
        /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
            ua
        )
    ) {
        deviceType = "mobile";
    }

    // 2. OS Family
    let osFamily = "Other";
    if (/windows phone/i.test(ua)) {
        osFamily = "Windows Phone";
    } else if (/win(dows|98|nt|ce)/i.test(ua)) {
        osFamily = "Windows";
    } else if (/android/i.test(ua)) {
        osFamily = "Android";
    } else if (/ipad|iphone|ipod/i.test(ua)) {
        osFamily = "iOS";
    } else if (/macintosh|mac os x/i.test(ua)) {
        osFamily = "macOS";
    } else if (/linux/i.test(ua)) {
        osFamily = "Linux";
    } else if (/cros/i.test(ua)) {
        osFamily = "Chrome OS";
    }

    // 3. Browser Family
    let browserFamily = "Other";
    if (/edg([ea]|ios)?\//i.test(ua)) {
        browserFamily = "Edge";
    } else if (/samsungbrowser/i.test(ua)) {
        browserFamily = "Samsung Internet";
    } else if (/opr\/|opera/i.test(ua)) {
        browserFamily = "Opera";
    } else if (/chrome|crios/i.test(ua)) {
        browserFamily = "Chrome";
    } else if (/firefox|fxios/i.test(ua)) {
        browserFamily = "Firefox";
    } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
        browserFamily = "Safari";
    }

    return {
        deviceType,
        browserFamily,
        osFamily,
    };
}

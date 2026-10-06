import { createHash } from "crypto";

const inFlightRequests = new Set();
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function stableStringify(value) {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(",")}]`;
    }
    if (value && typeof value === "object") {
        return `{${Object.keys(value).sort().map((key) =>
            `${JSON.stringify(key)}:${stableStringify(value[key])}`
        ).join(",")}}`;
    }
    return JSON.stringify(value);
}

function getRequestKey(req) {
    const method = req.method.toUpperCase();
    const route = req.originalUrl || req.url;
    const suppliedKey = req.get("Idempotency-Key");
    const contentType = (req.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const requestData = suppliedKey
        ? `key:${suppliedKey}`
        : `body:${stableStringify(req.body)}:type:${contentType}:length:${req.get("content-length") || ""}`;

    return createHash("sha256")
        .update(`${method}:${route}:${requestData}`)
        .digest("hex");
}

export function inFlightRequestMiddleware(req, res, next) {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
        next();
        return;
    }

    const key = getRequestKey(req);
    if (inFlightRequests.has(key)) {
        res.status(409).json({
            success: false,
            message: "This request is already in progress. Please wait.",
        });
        return;
    }

    inFlightRequests.add(key);
    let released = false;
    const release = () => {
        if (released) return;
        released = true;
        inFlightRequests.delete(key);
    };

    res.once("finish", release);
    res.once("close", release);
    next();
}




import { z } from 'zod';




export function ApiResponse(res, status = 200, msg = "Success", data = {}, extra = {}) {
    return res.status(status).json({
        success: true,
        msg,
        data,
        ...extra, // Koi bhi additional info (like pagination) ke liye
        timestamp: new Date().toISOString()
    });
}



export function ApiError(err, res) {
    try {
        console.log("lkdsjflaksdj",err)
        // 1. Check if it's a Zod Validation Error
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                msg: "Validation Failed",
                // Zod errors ko readable format mein convert karna
                errors: err?.ZodError?.map((e) => ({
                    field: e?.path.join('.'),
                    message: e.message
                })),
                type: "ValidationError"
            });
        }

        // 2. Check for Mongoose CastError (Invalid IDs)
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                msg: `Invalid ${err.path}: ${err.value}`,
                type: "CastError"
            });
        }

        // 3. Default Server Error
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            msg: err?.message || "Internal Server Error",
            // Stack trace sirf development mode mein dikhani chahiye
            stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
            type: err.name || "ServerError"
        });

        // return res.json({success:false, msg: err?.message, stack: err?.stack})
 
    } catch (error) {
        // Fallback agar error handling mein hi masla aa jaye
        return res.status(500).json({
            success: false,
            msg: "An unexpected error occurred in error handler",
            error: error?.message
        });
    }
}
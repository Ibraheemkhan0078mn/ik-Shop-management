import ErrorResponse from "../utils/ErrorResponse.js";

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.log(err);

    if (err.name === "CastError") {
        const message = `Resource not found with id of ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    if (err.code === 11000) {
        // Extract the field name from the duplicate key error
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        const value = err.keyValue?.[field] || '';
        const message = `${field.toUpperCase()} '${value}' already exists. Please use a unique ${field}.`;
        error = new ErrorResponse(message, 400);
    }

    if (err.name === "ValidationError") {
        // Yup gives err.errors as an array of strings.
        // Mongoose gives err.errors as an object of { field: errorObject }.
        // Handle both shapes.
        let message;
        if (Array.isArray(err.errors)) {
            message = err.errors.filter(Boolean).join(", ");
        } else if (err.errors && typeof err.errors === "object") {
            message = Object.values(err.errors).map((e) => e?.message || e).join(", ");
        } else {
            message = err.message;
        }
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Server Error",
    });
};

export default errorHandler;

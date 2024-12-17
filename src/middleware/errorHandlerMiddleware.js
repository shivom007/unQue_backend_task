export const errorHandler = (err, req, res, next) => {
    // Set default status code and error message
    const statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
    const error = err.message || "Something went wrong!";

    // Log the error (optional, useful for debugging in development)
    console.error(`[Error]: ${message}`, err);

    // Send a JSON response with the error details
    res.status(statusCode).json({
        message: 'An error occurred',
        error: error
    });
};

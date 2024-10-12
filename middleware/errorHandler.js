export const errorHandler = (err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body
    });

    const statusCode = err.statusCode || 500;
    const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: {
            code: statusCode,
            message: errorMessage,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString(),
            requestId: req.id // Assuming you're using a middleware to generate request IDs
        }
    });
};

export default errorHandler;

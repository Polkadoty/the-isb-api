module.exports = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Internal Server Error'
      }
    });
  };
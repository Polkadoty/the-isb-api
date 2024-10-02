exports.getStatus = (req, res) => {
    res.json({
      status: 'API is running',
      version: '1.0.0',
      message: 'Welcome to the Armada List Builder API'
    });
  };
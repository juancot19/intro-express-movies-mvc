export function notFound(req, res, next) {
  const err = new Error('Route not found');
  err.status = 404;
  next(err);
}

export function globalHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    res.status(400).json(err.errors);
    return;
  }

  if (err.status) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(404).json({ error: 'Resource not found' });
    return;
  }

  if (err.message?.includes('E11000')) {
    res.status(409).json({ error: 'Resource already exist' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

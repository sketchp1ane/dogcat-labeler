exports.requireRole = (...roles) => (req, res, next) =>
  req.session.user && roles.includes(req.session.user.role)
    ? next()
    : res.sendStatus(403);
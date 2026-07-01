const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  // Accept token from Authorization header OR ?token= query param (for browser-direct links)
  const header = req.headers.authorization;
  const queryToken = req.query.token;
  const token = queryToken || (header && header.startsWith("Bearer ") ? header.split(" ")[1] : null);
  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role, staffProfileId }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden — insufficient role permissions" });
    }
    next();
  };
}

module.exports = { authRequired, requireRole };

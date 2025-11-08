// app/middleware/authJwt.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization || req.headers.Authorization;
  const xToken = req.headers["x-access-token"];
  const token =
    xToken || (auth && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null);

  console.log("[verifyToken] header:", auth);
  console.log("[verifyToken] x-access-token:", xToken);
  console.log("[verifyToken] final token:", token);

  if (!token) return res.status(401).json({ message: "No token provided!" });

  jwt.verify(token, process.env.SECRET_KEY || "dev-secret", (err, decoded) => {
    if (err) {
      console.warn("[verifyToken] jwt.verify error:", err.message);
      return res.status(401).json({ message: "Unauthorized!", reason: err.message });
    }

    req.userId = decoded.id || decoded.userId || decoded.sub;
    req.user = { id: req.userId };
    console.log("[verifyToken] decoded ok:", decoded);
    next();
  });
};

module.exports = { verifyToken };

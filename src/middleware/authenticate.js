import { verifyToken } from "../utils/jwt.js";

export function authenticate(req, res, next) {
  const token = req.headers["authorization"];
//   console.log(token);
  if (!token) return res.status(401).json({ message: "No token provided" });
  if (!token.startsWith("Bearer "))
    return res.status(401).json({ message: "Invalid token" });

  try {
    const verified = verifyToken(token.split(" ")[1]);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token", error: err.message });
  }
}

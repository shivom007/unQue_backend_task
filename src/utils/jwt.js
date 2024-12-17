import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const { sign, verify } = jwt;

export function generateToken(payload) {
  return sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
}

export function verifyToken(token) {
  return verify(token, JWT_SECRET);
}

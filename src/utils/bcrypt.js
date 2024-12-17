import bcrypt from "bcrypt";
const { hash, compare } = bcrypt;
export async function hashPassword(password, salt) {
  return await hash(password, salt);
}

export async function comparePassword(password, hashedPassword) {
  return await compare(password, hashedPassword);
}

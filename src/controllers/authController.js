import bcrypt from "bcrypt";
import prisma from "../db/db.config.js";
import { generateToken } from "../utils/jwt.js";
import { Role } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
const salt = bcrypt.genSaltSync(10);
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userDto = {
      id: user.id,
      email: user.email,
      role: user.role
    }

    const token = generateToken(userDto);

    return res.status(200).json({ token,userDto });

  } catch (error) {
    return res.status(500).json({ message: "Error logging in user" , error: error.message});
  }
};

export const register = async (req, res) => {
  const { email, password, role } = req.body;
 
  //Validation added for checking if role is valid
  if (!Object.values(Role).includes(role)) {
    return res.status(400).json({ message: "Invalid role provided" });
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (existingUser) {
    return res.status(400).json({ message: "User with this email already exists" });
  }

  try {
    const hashedPassword = await hashPassword(password,salt);

    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        role: Role[role],
      },
    });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    
    return res.status(500).json({ message: "Error registering user", error: error.message });
  }
};

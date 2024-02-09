import Jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const JWT = {
  SIGN(payload) {
    return Jwt.sign({ id: payload }, JWT_SECRET);
  },
  VERIFY(token) {
    try {
      if (Jwt.verify(token, JWT_SECRET) instanceof Error)
        throw new Error("Expired token");
      else return Jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return err.message;
    }
  },
};

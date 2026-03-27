import jwt from "jsonwebtoken";
import User from "../modal/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Prefer httpOnly cookie (most secure — JS cannot read it)
    if (req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }
    // 2. Fall back to Authorization: Bearer header (for API clients / socket)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

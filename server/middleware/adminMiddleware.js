/**
 * adminOnly — must be used AFTER the protect middleware.
 * Allows access only to users with userType === "admin".
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.userType === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admins only." });
};

import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: "No token provided" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = payload.id;
    req.userRole = payload.role;
    //console.log(req.userId, req.userRole);

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

import { randomUUID } from "crypto";

export const anonIdMiddleware = (req, res, next) => {
  let anonId = req.cookies?.nexus_uid;

  if (!anonId) {
    anonId = randomUUID();
    res.cookie("nexus_uid", anonId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  req.anonId = anonId;
  next();
};

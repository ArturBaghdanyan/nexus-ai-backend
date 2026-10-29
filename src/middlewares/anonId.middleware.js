import { randomUUID } from "crypto";

export const anonIdMiddleware = (req, res, next) => {
  let cookieAnonId = req.cookies?.nexus_uid;

  if (!cookieAnonId) {
    cookieAnonId = randomUUID();
    res.cookie("nexus_uid", cookieAnonId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  const visitorId = req.headers["x-visitor-id"];
  req.anonId =
    typeof visitorId === "string" && visitorId.trim()
      ? visitorId.trim()
      : cookieAnonId;
  req.legacyAnonId = cookieAnonId;
  next();
};

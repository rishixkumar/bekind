export const HELLO_COOKIE_NAME = "bk_hello";
export const HELLO_COOKIE_VALUE = "1";
export const HELLO_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const HELLO_PATH = "/hello";

/** Short-lived, client-readable flag for the /hello → feed entrance animation. */
export const ENTER_COOKIE_NAME = "bk_from_hello";
export const ENTER_COOKIE_MAX_AGE = 60;

export const helloCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: HELLO_COOKIE_MAX_AGE,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export const enterCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: ENTER_COOKIE_MAX_AGE,
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
};

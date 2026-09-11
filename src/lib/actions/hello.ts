"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ENTER_COOKIE_NAME,
  HELLO_COOKIE_NAME,
  HELLO_COOKIE_VALUE,
  enterCookieOptions,
  helloCookieOptions,
} from "@/lib/hello";

export async function enterRoomAction() {
  const jar = await cookies();
  jar.set(HELLO_COOKIE_NAME, HELLO_COOKIE_VALUE, helloCookieOptions);
  jar.set(ENTER_COOKIE_NAME, "1", enterCookieOptions);
  redirect("/?from=hello");
}

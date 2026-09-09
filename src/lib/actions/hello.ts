"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  HELLO_COOKIE_NAME,
  HELLO_COOKIE_VALUE,
  helloCookieOptions,
} from "@/lib/hello";

export async function enterRoomAction() {
  const jar = await cookies();
  jar.set(HELLO_COOKIE_NAME, HELLO_COOKIE_VALUE, helloCookieOptions);
  redirect("/");
}

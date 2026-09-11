import { redirect } from "next/navigation";

/** Legacy route — email codes are no longer required. */
export default function VerifyPage() {
  redirect("/");
}

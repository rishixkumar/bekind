"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { issueVerificationCode, verifyCode } from "@/lib/verification";
import { verifyCodeSchema, type ActionState } from "@/lib/validations";

/** Both buttons on /verify post here, so only one can be in flight at a time. */
export async function verifyEmailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.isVerified) redirect("/");

  if (String(formData.get("intent") ?? "") === "resend") {
    const resent = await issueVerificationCode(user.id, user.email);
    if (!resent.ok) {
      return {
        error: resent.retryAfterSeconds
          ? `${resent.reason} (${resent.retryAfterSeconds}s)`
          : resent.reason,
      };
    }
    return { fieldErrors: { sent: "New code sent. Check your inbox." } };
  }

  const parsed = verifyCodeSchema.safeParse({
    code: String(formData.get("code") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter the 6-digit code." };
  }

  const result = await verifyCode(user.id, parsed.data.code);
  if (!result.ok) return { error: result.reason };

  revalidatePath("/", "layout");
  redirect("/?verified=1");
}

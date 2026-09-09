import { z } from "zod";
import { BODY_MAX, DETAILS_MAX, REPLY_MAX, REPORT_REASONS, TITLE_MAX } from "./constants";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email");

export const signUpSchema = z.object({
  email: emailField,
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or less")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const postSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Add a title")
    .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or less`),
  body: z
    .string()
    .trim()
    .min(1, "Write something")
    .max(BODY_MAX, `Keep it under ${BODY_MAX} characters`),
  isAnonymous: z.boolean(),
});

export const replySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a reply")
    .max(REPLY_MAX, `Keep it under ${REPLY_MAX} characters`),
  isAnonymous: z.boolean(),
  parentId: z.string().uuid().optional().nullable(),
});

export const reportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z
    .string()
    .trim()
    .max(DETAILS_MAX, `Keep it under ${DETAILS_MAX} characters`)
    .optional(),
});

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

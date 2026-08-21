// lib/validators.ts
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const trimRequired = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const InquirySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z.preprocess(emptyToUndefined, z.string().max(40).optional()),
  sessionType: z.preprocess(
    emptyToUndefined,
    z.string().max(50).optional()
  ),
  message: z.preprocess(emptyToUndefined, z.string().max(2000).optional()),
});

export type InquiryInput = z.infer<typeof InquirySchema>;

// Quiz lead capture. Progressive: email is required on every post; name/phone
// arrive on the later "complete" post. GHL delivery is completion-only so the
// first CRM write carries phone/name for SMS workflows.
const QuizAnswerItem = z.object({
  q: z.string().max(160),
  a: z.string().max(400),
});

export const QuizLeadSchema = z.object({
  stage: z.enum(["email", "complete"]).optional(),
  email: z.preprocess(
    trimRequired,
    z.string().email("Please enter a valid email address")
  ),
  name: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(100).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  why: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  whyQuestion: z.preprocess(emptyToUndefined, z.string().trim().max(240).optional()),
  quizId: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  sessionId: z.preprocess(emptyToUndefined, z.string().trim().max(64).optional()),
  resultKey: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  score: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(0).max(100).optional()
  ),
  answers: z.array(QuizAnswerItem).max(40).optional(),
});

export type QuizLeadInput = z.infer<typeof QuizLeadSchema>;

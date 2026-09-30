import { z } from "zod";
import { mobileSchema } from "./phone.js";

export const PASSWORD_MIN_LENGTH = 8;

export const passwordSchema = z
  .string({ error: "اكتب كلمة السر" })
  .min(PASSWORD_MIN_LENGTH, `كلمة السر لازم تبقى ${PASSWORD_MIN_LENGTH} حروف على الأقل`)
  .max(72, "كلمة السر طويلة زيادة");

const nameSchema = (label: string) =>
  z.string({ error: `اكتب ${label}` }).trim().min(2, `اكتب ${label}`).max(80, `${label} طويل زيادة`);

export const loginSchema = z.object({
  phone: mobileSchema,
  // في الدخول مابنقولش شروط كلمة السر، بس لازم تبقى مكتوبة
  password: z.string({ error: "اكتب كلمة السر" }).min(1, "اكتب كلمة السر").max(72),
  remember: z.boolean().default(true),
});
export type LoginInput = z.input<typeof loginSchema>;
export type LoginData = z.output<typeof loginSchema>;

export const registerSchema = z.object({
  shopName: nameSchema("اسم المحل"),
  ownerName: nameSchema("اسمك"),
  phone: mobileSchema,
  password: passwordSchema,
});
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterData = z.output<typeof registerSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const userRoles = ["owner", "technician"] as const;
export type UserRole = (typeof userRoles)[number];

/** اللي جوه الـ access token */
export type AccessTokenClaims = {
  sub: string;
  shopId: string;
  role: UserRole;
  canQuote: boolean;
};

export type AuthTokens = {
  accessToken: string;
  /** بالثواني */
  accessTokenExpiresIn: number;
  refreshToken: string;
  /** بالثواني */
  refreshTokenExpiresIn: number;
};

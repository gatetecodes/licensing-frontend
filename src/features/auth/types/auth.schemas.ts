import { z } from "zod";

const passwordRule =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,32}$/;

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Full name is required.")
      .max(50, "Full name cannot exceed 50 characters."),
    email: z
      .string()
      .min(1, "Email is required.")
      .email("Please provide a valid email address."),
    institution_name: z
      .string()
      .min(1, "Institution name is required.")
      .max(100, "Institution name cannot exceed 100 characters."),
    password: z
      .string()
      .regex(
        passwordRule,
        "Password must be 8-32 chars with uppercase, lowercase, number, and special character.",
      ),
    confirmPassword: z.string().min(1, "Password confirmation is required."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const verifyEmailTokenSchema = z.object({
  token: z.string().min(1, "Verification token is required."),
});

export const setPasswordFormSchema = z
  .object({
    token: z.string().min(1, "Setup token is required."),
    newPassword: z
      .string()
      .regex(
        passwordRule,
        "Password must be 8-32 chars with uppercase, lowercase, number, and special character.",
      ),
    confirmPassword: z.string().min(1, "Password confirmation is required."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SetPasswordFormValues = z.infer<typeof setPasswordFormSchema>;

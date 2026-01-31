import { z } from "zod";

/**
 * Login Schema
 * Required fields: email, password
 */
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Signup Schema
 * Company user registration with phone OTP verification
 */
export const signupSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  otp: z.string().optional(),
});

export type SignupFormData = z.infer<typeof signupSchema>;

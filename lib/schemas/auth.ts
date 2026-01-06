import { z } from "zod";

/**
 * Login Schema
 * Required fields: email, password, company_id
 */
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  company_id: z.string().uuid("Please select a valid company"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Signup Schema
 * Supports both RETAILER and COMPANY_USER registration
 */
export const signupSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  user_type: z.enum(["COMPANY_USER", "RETAILER"], {
    required_error: "Please select a user type",
  }),
  company_id: z.string().uuid().optional(),
  phone: z.string().optional(),
  business_name: z.string().optional(),
  gstin: z.string().optional(),
});

export type SignupFormData = z.infer<typeof signupSchema>;

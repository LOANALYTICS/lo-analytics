"use client";
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Separator } from "../ui/separator";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeClosed } from "lucide-react";

const formSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [togglePasswordView, setTogglePasswordView] = useState(true);
  const [toggleConfirmPasswordView, setToggleConfirmPasswordView] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        toast.error("Invalid reset link");
        setVerifying(false);
        return;
      }

      try {
        const res = await axios.post("/api/auth/verify-reset-token", {
          token,
          email,
        });

        if (res.data.valid) {
          setTokenValid(true);
          // Store token info in sessionStorage for additional security
          sessionStorage.setItem("reset_token", token);
          sessionStorage.setItem("reset_email", email);
        } else {
          toast.error("Invalid or expired reset link");
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Invalid or expired reset link");
      }
      setVerifying(false);
    };

    verifyToken();
  }, [token, email]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Verify token from sessionStorage matches URL
    const storedToken = sessionStorage.getItem("reset_token");
    const storedEmail = sessionStorage.getItem("reset_email");

    if (storedToken !== token || storedEmail !== email) {
      toast.error("Security validation failed. Please request a new reset link.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/reset-password", {
        token,
        email,
        password: values.password,
      });

      if (res.status === 200) {
        toast.success("Password reset successful");
        sessionStorage.removeItem("reset_token");
        sessionStorage.removeItem("reset_email");
        router.push("/sign-in");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to reset password");
    }
    setLoading(false);
  }

  if (verifying) {
    return (
      <section className="min-w-[400px] border shadow-sm rounded-lg py-4 px-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      </section>
    );
  }

  if (!tokenValid) {
    return (
      <section className="min-w-[400px] border shadow-sm rounded-lg py-4 px-6">
        <div className="">
          <h2 className="font-extrabold text-2xl">Invalid Link</h2>
          <Separator className="my-3" />
        </div>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full">Request New Reset Link</Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-[400px] border shadow-sm rounded-lg py-4 px-6">
      <div className="">
        <h2 className="font-extrabold text-2xl">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your new password
        </p>
        <Separator className="my-3" />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl className="relative">
                  <div>
                    <Input
                      type={togglePasswordView ? "password" : "text"}
                      placeholder="Enter new password"
                      {...field}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer">
                      {togglePasswordView ? (
                        <Eye size={20} onClick={() => setTogglePasswordView(false)} />
                      ) : (
                        <EyeClosed size={20} onClick={() => setTogglePasswordView(true)} />
                      )}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl className="relative">
                  <div>
                    <Input
                      type={toggleConfirmPasswordView ? "password" : "text"}
                      placeholder="Confirm new password"
                      {...field}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer">
                      {toggleConfirmPasswordView ? (
                        <Eye size={20} onClick={() => setToggleConfirmPasswordView(false)} />
                      ) : (
                        <EyeClosed size={20} onClick={() => setToggleConfirmPasswordView(true)} />
                      )}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            style={{ marginTop: "20px" }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Reset Password"}
          </Button>
        </form>
      </Form>
    </section>
  );
}

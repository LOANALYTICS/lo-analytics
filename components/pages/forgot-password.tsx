"use client";
import React, { useState } from "react";
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
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/forgot-password", values);

      if (res.status === 200) {
        toast.success("Password reset link sent to your email");
        setEmailSent(true);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send reset link");
    }
    setLoading(false);
  }

  if (emailSent) {
    return (
      <section className="min-w-[400px] border shadow-sm rounded-lg py-4 px-6">
        <div className="">
          <h2 className="font-extrabold text-2xl">Check Your Email</h2>
          <Separator className="my-3" />
        </div>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If an account exists with the email you provided, you will receive a password reset link shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            Please check your inbox and spam folder.
          </p>
          <Link href="/sign-in">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
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
        <h2 className="font-extrabold text-2xl">Forgot Password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email to receive a password reset link
        </p>
        <Separator className="my-3" />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} />
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
            {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
          </Button>
          <p className="text-xs text-center">
            Remember your password?{" "}
            <Link href="/sign-in" className="font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </Form>
    </section>
  );
}

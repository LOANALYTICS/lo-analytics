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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Separator } from "../ui/separator";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeClosed, Loader2 } from "lucide-react";
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  collage: z.string(),
});
export default function SignIn({ collages }: { collages: any }) {
  const [togglePasswordView, setTogglePasswordView] = useState(true)
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      collage: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login-user", values);

      if (res.status === 200) {
        toast.success("Account login successfully");
        localStorage.setItem("user", JSON.stringify(res?.data?.user));
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
    }
    setLoading(false);
  }
  const collagesData = collages?.map((collage: any) => ({
    value: collage._id,
    label: collage.english,
  }));
  return (
    <section className="min-w-[400px] border shadow-sm rounded-lg py-4 px-6">
      <div className="">
        <h2 className="font-extrabold text-2xl">Sign In</h2>
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
                  <Input placeholder="Email" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <FormControl className="relative">
                  <div>

                  <Input type={togglePasswordView ? 'password' : "text"} placeholder="Password" {...field} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer">
                    {
                      togglePasswordView ?
                      <Eye size={20} onClick={() => setTogglePasswordView(false)}/> :
                      <EyeClosed size={20} onClick={() => setTogglePasswordView(true)}/>
                    }
                  </span>
                  </div>
                 
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="collage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select College" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {collagesData &&
                      collagesData?.map((collage: any) => (
                        <SelectItem key={collage.value} value={collage.value}>
                          {collage.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full "
            style={{ marginTop: "20px" }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </Button>
          <p className="text-xs">
            Dont have an account?{" "}
            <Link href="/sign-up" className="font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </Form>
    </section>
  );
}

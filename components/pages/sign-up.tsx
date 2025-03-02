"use client"
import React, { useState } from 'react'
import { z } from "zod"
import axios from 'axios'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"


import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"

import { Input } from "@/components/ui/input"
import { Separator } from '../ui/separator'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  collage: z.string(),
})
export default function SignUp({collages}:{collages:any}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          name: "",
          email: "",
          password: "",
          collage:""
        },
      })
     
      async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
          const res = await axios.post("/api/auth/register-user", values)
          if(res.status === 201){
            toast.success("Account created successfully")
            router.push("/dashboard")
          }
        } catch (error) {
          console.error(error)
        }
        setLoading(false)
      }
      const collagesData = collages?.map((collage:any)=>({
        value:collage._id,
        label:collage.english
      }))
    return (
        <section className='min-w-[400px] border shadow-sm rounded-lg py-4 px-6'>
             <div className=''>
                <h2 className='font-extrabold text-2xl'>Sign Up</h2>
                <Separator className='my-3' />
            </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem >
                  <FormLabel>User name</FormLabel>
                  <FormControl>
                    <Input required placeholder="Username" {...field} />
                  </FormControl >
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem >
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input required placeholder="Email" {...field} />
                  </FormControl >
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input required placeholder="Password" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
              <FormField
              
          control={form.control}
          name="collage"
          render={({ field }) => (
            <FormItem >
              <FormLabel>Collage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Collage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  { collagesData && collagesData?.map((collage:any)=>(
                    <SelectItem key={collage.value} value={collage.value}>{collage.label}</SelectItem>
                  ))}
                
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
            <Button type="submit" className='w-full ' style={{marginTop:"20px"}} disabled={loading}>
              {loading ? <Loader2 className='animate-spin' /> : "Sign Up"}
            </Button>
            <p className='text-xs'>Already have an account? <Link href="/sign-in" className='font-semibold hover:underline '>Sign In</Link></p>
          </form>
        </Form>
        </section>
      )
}

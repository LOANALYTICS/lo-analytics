"use client"
import React from 'react'
import { z } from "zod"

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
import Link from 'next/link'
import { Separator } from '../ui/separator'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  collage_name: z.string(),
})
export default function SignIn() {

    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          email: "",
          password: "",
          collage_name:""
        },
      })
     
      async function onSubmit(values: z.infer<typeof formSchema>) {

        try {
          const res = await axios.post("http://localhost:3000/api/auth/login-user", values)
          if(res.status === 200){
            console.log(res)
            toast.success("Account created successfully")
            localStorage.setItem('user', res.data)
            router.push("/dashboard")
          }
          console.log(res)
        } catch (error) {
          console.error(error)
        }
      }
    return (
        <section className='min-w-[400px] border shadow-sm rounded-lg py-4 px-6'>
            <div className=''>
                <h2 className='font-extrabold text-2xl'>Sign In</h2>
                <Separator className='my-3' />
            </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem >
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
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
                    <Input placeholder="Password" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
              <FormField
          control={form.control}
          name="collage_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collage</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Collage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="collage_092">Collage 092</SelectItem>
                  <SelectItem value="collage_82">Collage 82</SelectItem>
                  <SelectItem value="collage_23">Collage 23</SelectItem>
                </SelectContent>
              </Select>
           
              <FormMessage />
            </FormItem>
          )}
        />
            <Button type="submit" className='w-full ' style={{marginTop:"20px"}}>Sign In</Button>
            <p className='text-xs'>Dont have an account? <Link href="/sign-up" className='font-semibold hover:underline'>Sign Up</Link></p>
          </form>
        </Form>
        </section>
      )
}

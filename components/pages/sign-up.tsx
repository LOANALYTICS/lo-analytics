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
import { Separator } from '../ui/separator'
import Link from 'next/link'
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  collage_name: z.string(),
})
export default function SignUp() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          email: "",
          password: "",
          collage_name:""
        },
      })
     
      function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
      }
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
          name="collage_name"
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
                  <SelectItem value="collage_092">Collage 092</SelectItem>
                  <SelectItem value="collage_82">Collage 82</SelectItem>
                  <SelectItem value="collage_23">Collage 23</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
            <Button type="submit" className='w-full ' style={{marginTop:"20px"}}>Sign Up</Button>
            <p className='text-xs'>Already have an account? <Link href="/sign-in" className='font-semibold hover:underline '>Sign In</Link></p>
          </form>
        </Form>
        </section>
      )
}

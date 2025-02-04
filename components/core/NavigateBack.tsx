'use client'
import React from 'react'
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NavigateBack() {
    const router = useRouter()
  return (
    <div
    onClick={() => router.back()}
     className="h-8 w-8 flex items-center justify-center rounded-full cursor-pointer bg-black">
        <ArrowLeft color="white" />
    </div>
  )
}

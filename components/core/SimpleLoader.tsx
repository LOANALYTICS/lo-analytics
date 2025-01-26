import { Loader2Icon } from 'lucide-react'
import React from 'react'

export default function SimpleLoader() {
  return (
    <div className='w-full h-1/3 flex justify-center items-center'><Loader2Icon className='animate-spin text-primary h-6 w-6'/></div>
  )
}

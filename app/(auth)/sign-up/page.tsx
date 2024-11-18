import SignUp from '@/components/pages/sign-up'
import { getCollage } from '@/services/collage.action'
import React from 'react'

export default async function SignUpPage() {
  const collages = await getCollage ()
  return (
    <main className=" h-screen w-screen flex items-center justify-center p-10">
      <SignUp collages={collages}/>
    </main>
  )
}
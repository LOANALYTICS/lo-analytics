export const dynamic = 'force-dynamic'
import SignIn from '@/components/pages/sign-in'
import { getCollage } from '@/services/collage.action'
import React from 'react'

export default async function SignInPage() {
  const collages = await getCollage()
  return (
    <main className=" h-screen w-screen flex items-center justify-center p-10">
      <SignIn collages={collages}/>
    </main>
  )
}

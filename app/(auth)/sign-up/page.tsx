import SignUp from '@/components/pages/sign-up'
import { getCollage } from '@/services/collage.action'
import React from 'react'

// Add these export statements at the top of the file
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SignUpPage() {
  try {
    const collages = await getCollage()
    
    if (!collages) {
      throw new Error('Failed to fetch colleges')
    }

    return (
      <main className="h-screen w-screen flex items-center justify-center p-10">
        <SignUp collages={collages}/>
      </main>
    )
  } catch (error) {
    // Provide a fallback UI when data fetch fails
    return (
      <main className="h-screen w-screen flex items-center justify-center p-10">
        <SignUp collages={[]}/>
      </main>
    )
  }
}
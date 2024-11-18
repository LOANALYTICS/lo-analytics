import { Button } from '@/components/ui/button'
import { getCollage } from '@/services/collage.action'
import { Plus } from 'lucide-react'
import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import AddCollegeForm from '@/components/shared/admin/AddCollegeForm'
import Image from 'next/image'
export default async function ManageCollage() {
    const collages = await getCollage()
  return (
    <main className="px-2">
        <div className="flex justify-between items-center">
       <h1 className="font-semibold text-lg">Manage Collage</h1>
       
      

       <Dialog>
  <DialogTrigger>
        <Plus className='p-1 border border-gray-300 rounded-md' />
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add new collage</DialogTitle>
    </DialogHeader>
    <AddCollegeForm />
  </DialogContent>
</Dialog>
        </div>
       <section className="flex flex-col gap-2 mt-4 ">
      {
        collages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {collages.map((collage) => (
              <div key={collage._id} className='flex gap-2 items-center border border-gray-300 shadow-sm rounded-md p-2'>
                <div>
                    <Image src={collage.logo} alt={collage.english} width={100} height={100} />
                </div>
                <div>
                    <h2>{collage.english}</h2>
                    <p>{collage.regional}</p>
                    <p>{collage.university}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No collages found</div>
        )
      }
      </section>
    </main>
  )
}

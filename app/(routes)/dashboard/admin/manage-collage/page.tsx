'use client'
import React, { useState, useEffect } from 'react'
import { getCollage, getCollageByRole } from '@/services/collage.action'
import { Loader2, Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import AddCollegeForm from '@/components/shared/admin/AddCollegeForm'
import Image from 'next/image'
import Link from 'next/link'
export default function ManageCollage() {
    const [collages, setCollages] = useState<any>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const USER = JSON.parse(localStorage.getItem('user') || '{}')
    useEffect(() => {
        const fetchCollages = async () => {
            setLoading(true)
            try {
                const collageData = await getCollageByRole(USER?._id)
                setCollages(collageData)
            } catch (error) {
                console.error('Error fetching collages:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCollages()
    }, [])

    const refetchCollages = async () => {
        setLoading(true)
        try {
            const collageData = await getCollage()
            setCollages(collageData)
        } catch (error) {
            console.error('Error refetching collages:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="px-2">
            <div className="flex justify-between items-center">
                <div className='flex justify-between w-full'>

                <h1 className="font-semibold text-lg">Manage Collage</h1>
                {
                    USER?.role === 'admin' && (
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger className='px-4 py-2 border border-gray-300 hover:bg-blue-50 rounded-md flex items-center gap-2 text-sm' >
                       Add  College <Plus size={16} />
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add new collage</DialogTitle>
                        </DialogHeader>
                        <AddCollegeForm onClose={() => {
                            setIsOpen(false)
                            refetchCollages()
                        }} />
                    </DialogContent>
                </Dialog>
                    )
                }
                </div>
               
            </div>
            <section className="flex flex-col gap-2 mt-4 ">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : collages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {collages.map((collage : any) => (
                            <Link key={collage._id} href={`/dashboard/admin/manage-collage/${collage._id}`} className='flex gap-2 items-center border border-gray-300 shadow-sm rounded-md p-2'>
                                <div>
                                    <Image src={collage.logo} alt={collage.english} width={100} height={100} />
                                </div>
                                <div>
                                    <h2>{collage.english}</h2>
                                    <p>{collage.regional}</p>
                                    <p>{collage.university}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div>No colleges found</div>
                )}
            </section>
        </main>
    )
}

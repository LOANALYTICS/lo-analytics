import NavigateBack from '@/components/core/NavigateBack'
import ContactForm from '@/components/pages/contact-form'
import React from 'react'

export default function page() {
  return (
    <section className="w-full h-full pt-8 space-y-24 p-4 relative">
        <div className='flex items-center gap-2'>

        <NavigateBack/>
        <p>Back to analytics</p>
        </div>
        <section className='space-y-4 max-w-5xl mx-auto'>
        <div className='flex flex-col md:flex-row h-full w-full items-center justify-center gap-8'>
        <div className=" flex  items-center justify-center w-full overflow-hidden relative rounded-xl">
      <img src="/assets/contact.jpg" alt="Description" className="object-cover h-full w-full ab" />
    </div>
    <ContactForm />
  
        </div>
        <div className=' border rounded-xl p-4 flex items-start justify-around gap-4'>
   <p className='py-2 px-8 bg-blue-100 rounded-full font-medium'> <span className='font-bold text-black'>Email:</span> example@gmail.com</p>
   <p className='py-2 px-8 bg-blue-100 rounded-full font-medium'> <span className='font-bold text-black'>Address:</span>  example@gmail.com</p>
</div>
        </section>
       
   
  </section>
  )
}

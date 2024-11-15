"use client"

import React, { useState } from "react"
import { DynamicDropdownMenu } from '@/components/shared/MultiSelect'
import { IUser } from '@/server/models/user.model'
import { getUsersByRole } from '@/services/users.actions'

export default function ManageCoordinators() {
  const [coordinators, setCoordinators] = useState<IUser[]>([])

  React.useEffect(() => {
    const fetchCoordinators = async () => {
      const data = await getUsersByRole("course_coordinator")
      setCoordinators(data)
    }

    fetchCoordinators()
  }, [])

  // State for each dropdown's selection, maintained by the parent
  const [dropdownState, setDropdownState] = useState<Record<string, boolean>>({})

  const handleCheckedChange = (option: string, checked: boolean) => {
    setDropdownState(prevState => ({
      ...prevState,
      [option]: checked,
    }))
  }

  return (
    <main className='px-2'>
      <h1 className='font-semibold text-lg'>Manage Coordinators - ( {coordinators.length} )</h1>
      <section className='flex flex-col gap-2 mt-4'>
        {coordinators.map((coordinator, idx) => (
          <div key={idx} className='flex justify-between items-center border border-gray-300 shadow-sm px-3 rounded-md p-2'>
            <h2>{coordinator.name}</h2>
            <DynamicDropdownMenu
              options={["Item Analysis", "Question Bank", "Learning Outcome"]}
              state={dropdownState} // Pass the state
              handleCheckedChange={handleCheckedChange} // Pass the handler
            />
          </div>
        ))}
      </section>
    </main>
  )
}

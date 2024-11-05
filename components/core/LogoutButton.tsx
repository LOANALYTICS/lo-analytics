'use client'
import React from 'react'
import { Button } from '../ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  return (
    <Button variant={"outline"} onClick={() => 
        localStorage.removeItem('user')
      } className="flex  bottom-0 gap-2">
          <LogOut className="text-xl min-w-[20px] w-[20px] ml-1"/>
          <span className="text-black">Logout </span>
          </Button>
  )
}

'use client'
import React from 'react'
import { Button } from '../ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const handleLogout = () => {
    // Remove the cookie (only works if it's not HTTP-only)
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Optionally, clear localStorage (if needed)
    localStorage.removeItem('user');

    // Redirect or reload page after logging out
    window.location.href = '/sign-in'; // Redirect to sign-in page after logout
  };

  return (
    <Button variant="outline" onClick={handleLogout} className="flex bottom-0 gap-2">
      <LogOut className="text-xl min-w-[20px] w-[20px] ml-1" />
      <span className="text-black">Logout</span>
    </Button>
  );
}

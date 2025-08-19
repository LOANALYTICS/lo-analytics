"use client"
import LogoutButton from '@/components/core/LogoutButton';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TopbarProps {
  user: any;
  role: string;
}

const Topbar = ({ user, role }: TopbarProps) => {
  const pathname = usePathname();
  const isLearningOutcome = pathname.includes("learning-outcomes");

  const topbarLinks = [
    { 
      name: "Add Course", 
      href: isLearningOutcome ? "/dashboard/new-course?src=lc" : "/dashboard/new-course", 
      icon: Plus 
    },
  ];

  return (
    <section className="h-16 min-h-16 w-full border flex justify-between pl-16 pr-4 rounded-xl">
      <div className="flex gap-3 items-center">
        <p className=''>
          <span className='font-semibold'>You: </span>{user?.name}
        </p>
      </div>
      <div className='flex gap-3 items-center'>
        {
          role !== "admin" && topbarLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex gap-1 items-center py-3 px-3 rounded-lg hover:bg-neutral-100 bg-neutral-300"
            >
              <link.icon size={14} />
              <span className="text-xs">{link.name}</span>
            </Link>
          ))
        }
        <LogoutButton />
      </div>
    </section>
  );
};

export default Topbar;
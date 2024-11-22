import { cookies } from 'next/headers'; // Import cookies from next/headers
import LogoutButton from '@/components/core/LogoutButton';
import Sidebar from '@/components/core/sidebar/sidebar';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getRole } from '@/server/utils/helper';

const BaseLayout = async ({ children }: { children: React.ReactNode }) => {

  const role = await getRole("token");
  
  console.log('User Cokie:', role);

  const topbarLinks = [
    { name: "Add Course", href: "/dashboard/new-course", icon: Plus },
  ];

  return (
    <div className="flex p-2 h-screen gap-2">
      <Sidebar userRole={role} />
      <div className="flex-1 flex flex-col gap-2">
        <section className="h-16 min-h-16 w-full border flex justify-end px-4 rounded-xl">
          <div className="flex gap-3 items-center">
            {
              topbarLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className=" flex gap-1 items-center py-3 px-3 rounded-lg hover:bg-neutral-100 bg-neutral-300"
                >
                  <link.icon size={14} />
                  <span className="text-xs">{link.name}</span>
                </Link>
              ))
            }

            <LogoutButton />
          </div>
        </section>
        <section className="  flex-1 overflow-y-auto bg-white border rounded-xl p-2 ">
          {children}
        </section>
      </div>
    </div>
  );
};

export default BaseLayout;

"use client";
import { useState } from "react";
import Image from "next/image";
import { SidebarIcon, ChartBarStacked, SquareLibrary, BookOpenCheck, Plus, User, UsersRound, BookDashed, AsteriskSquare, Building,Contact2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarItems: SidebarItem[] = [
  { name: "Item Analysis", displayName: "Item Analysis (KR20)", href: "/dashboard/item-analysis", icon: ChartBarStacked },

  { name: "Question Bank", displayName: "Question Bank", href: "/dashboard/question-bank", icon: SquareLibrary },
  {
    name: "Learning Outcome", displayName: "Learning Outcome", href: "/dashboard/blueprint", icon: BookOpenCheck,
    others: [
      { name: "Student Details", href: "/dashboard/blueprint/student-details", icon: UsersRound },
      { name: "Learning Outcomes", href: "/dashboard/blueprint/learning-outcomes", icon: BookDashed },
      { name: "Assessment Plan", href: "/dashboard/blueprint/assessment-plan", icon: AsteriskSquare },
    ]
  },
];

const adminSidebarLinks: SidebarItem[] = [
  { name: "Manage College", href: "/dashboard/admin/manage-collage", icon: Building },
  { name: "Create Course", href: "/dashboard/admin/create-course", icon: Plus },
  { name: "Manage Course", href: "/dashboard/admin/manage-courses", icon: BookDashed },
  { name: "Manage ", href: "/dashboard/admin/manage-coordinators", icon: User },
];
interface SidebarItem {
  name: string;
  displayName?: string;
  href: string;
  icon: any;
  others?: SidebarItem[];
}


const Sidebar = ({ userRole, userPermissions,user }: { userRole: string, userPermissions: string[],user:any }) => {
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const toggleExpand = (name: any) => {
    setExpandedItems((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const filteredSidebarItems = sidebarItems.filter(item => {
    return userPermissions.includes(item.name);
  });

  return (
    <div className="relative">
      <button
        className="absolute top-3.5 right-[-48px] flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded-full shadow transition-transform transform hover:scale-110"
        onClick={toggleSidebarCollapse}
      >
        {isCollapsed ? <SidebarIcon /> : <SidebarIcon />}
      </button>
      <aside
        className={`h-full border rounded-xl bg-white transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? "w-16" : "w-64"
          }`}
      >
        <div className="flex h-16 transition-opacity px-2 py-2 duration-300">
          <div className="px-1 flex w-full cursor-pointer gap-2 items-center rounded-md hover:bg-neutral-100">
            <Image
              width={36}
              height={36}
              className="rounded-lg aspect-square border p-1"
              src="/assets/logo.svg"
              alt="logo"
            />
            <p className=
              {`text-xs font-bold break-keep line-clamp-1  transition-opacity duration-300 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100 "
                }`}
            >University</p>
          </div>
        </div>
        <ul className="p-2 h-full flex flex-col gap-3">

          {
            userRole === "admin" && (
              <div className="space-y-1">
                {
                  isCollapsed ? (
                    <h4 className="px-4 font-bold pb-1">...</h4>
                  ) : (
                    <h4 className="px-4 font-bold pb-1">Admin</h4>
                  )
                }
                {adminSidebarLinks.map(({ name, href, icon: Icon }) => (
                  <li key={name}>
                    <Link
                      href={href}
                      className={`flex items-center p-2 rounded-lg text-black transition-colors duration-200 ${pathname === `${href}` ? "bg-neutral-500 text-white" : "hover:bg-gray-200"
                        }`}
                    >
                      <Icon className="text-xl min-w-[20px] w-[20px] ml-1" />
                      <span
                        className={`ml-4 break-keep line-clamp-1 text-sm font-medium transition-opacity duration-300 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
                          }`}
                      >
                        {name}
                      </span>
                    </Link>
                  </li>
                ))}
              </div>
            )
          }

          <div className="space-y-1">
            {userRole !== "admin" && (
              isCollapsed ? (
                <h4 className="px-4 font-bold pb-1">...</h4>
              ) : (
                <h4 className="px-4 font-bold pb-1">General</h4>
              )
            )
            }
            {userRole !== "admin" && filteredSidebarItems.map(({ name, displayName, href, icon: Icon, others }) => (
              <li key={name}>
                {!others ? (
                  <Link
                    href={href}
                    className={`flex items-center p-2 rounded-lg text-black transition-colors duration-200 ${pathname === href ? "bg-neutral-500 text-white" : "hover:bg-gray-200"}`}
                  >
                    <Icon className="text-xl min-w-[20px] w-[20px] ml-1" />
                    <span className={`ml-4 break-keep line-clamp-1 text-sm font-medium transition-opacity duration-300 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                      {displayName || name}
                    </span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => toggleExpand(name)}
                      className="flex items-center p-2 rounded-lg text-black transition-colors duration-200 hover:bg-gray-200 w-full"
                    >
                      <Icon className="text-xl min-w-[20px] w-[20px] ml-1" />
                      <span className={`ml-4 break-keep line-clamp-1 text-sm font-medium transition-opacity duration-300 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                        {displayName || name}
                      </span>
                      {!isCollapsed && <span className="ml-auto text-xl">{expandedItems[name] ? '−' : '+'}</span>}
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedItems[name] ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 scale-95'}`}>
                      <ul className={`${isCollapsed ? "" : "ml-6"} mt-2 space-y-1`}>
                        {others.map(({ name: otherName, href: otherHref, icon: OtherIcon }) => (
                          <li key={otherName}>
                            <Link
                              href={otherHref}
                              className={`flex items-center p-2 rounded-lg text-black transition-colors duration-200 ${pathname === otherHref ? "bg-neutral-500 text-white" : "hover:bg-gray-200"}`}
                            >
                              <OtherIcon className="text-xl min-w-[20px] w-[20px] ml-1" />
                              <span className={`ml-4 break-keep line-clamp-1 text-sm font-medium transition-opacity duration-300 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                                {otherName}
                              </span>
                            </Link>
                          </li>
                        ))}
                         

                      </ul>
                    </div>
                  </>
                )}
              </li>
            ))}

          </div>
<Link
                              href={'/support'}
                              className={`flex items-center mt-auto mb-[68px]  p-2 rounded-lg text-black transition-colors duration-200 ${pathname === '/support' ? "bg-neutral-500 text-white" : "hover:bg-gray-200"}`}
                            >
                              <Contact2 className="text-xl min-w-[20px] w-[20px] ml-1" />
                              <span className={`ml-4 break-keep line-clamp-1 text-sm font-medium transition-opacity duration-300 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                                {'Contact & support'}
                              </span>
                            </Link>
        </ul>

      </aside>
    </div>
  );
};

export default Sidebar;

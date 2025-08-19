import Sidebar from '@/components/core/sidebar/sidebar';
import Topbar from '@/components/core/topbar/topbar';
import { getCurrentUser, getRole } from '@/server/utils/helper';

const BaseLayout = async ({ children }: { children: React.ReactNode }) => {
  const role = await getRole("token");
  const user = await getCurrentUser();

  return (
    <div className="flex p-2 h-screen gap-2">
      <Sidebar userRole={role} user={user} userPermissions={user?.permissions ?? []} />
      <div className="flex-1 flex flex-col gap-2">
        <Topbar user={user} role={role} />
        <section className="flex-1 overflow-y-auto bg-white border rounded-xl p-2">
          {children}
        </section>
      </div>
    </div>
  );
};

export default BaseLayout;
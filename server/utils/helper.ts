import { cookies } from 'next/headers';
import { jwtDecode } from "jwt-decode";
interface CustomJwtPayload {
    data: {
        role: string;
    }
   
  }
export async function getRole(cookieName: string): Promise<any> {
    const cookieStore = await cookies(); // Correctly typed
    const cookie = cookieStore.get(cookieName); // No TypeScript error

    const decoded = jwtDecode<CustomJwtPayload>(cookie?.value || '');
    return decoded?.data?.role || null;
}
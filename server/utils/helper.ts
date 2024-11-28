'use server'
import { cookies } from 'next/headers';
import { jwtDecode } from "jwt-decode";
interface CustomJwtPayloadRole {
        role: string;
  }

  interface UserJwtPayload {
      _id: string;
      email: string;
      name: string;
      role: string;
      cid: any;
      permissions: string[];
  }
export async function getRole(cookieName: string): Promise<any> {
    const cookieStore = await cookies(); // Correctly typed
    const cookie = cookieStore.get(cookieName); // No TypeScript error

    const decoded = jwtDecode<CustomJwtPayloadRole>(cookie?.value || '');
    return decoded?.role || null;
}

export async function getCurrentUser() {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
  
      if (!token) {
        return null;
      }
  
      const decoded = jwtDecode<UserJwtPayload>(token);
      
      if (!decoded) {
        return null;
      }
  
      return {
        id: decoded?._id,
        email: decoded?.email,
        name: decoded?.name,
        role: decoded?.role,
        cid: decoded?.cid,
        permissions: decoded?.permissions,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
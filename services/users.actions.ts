"use server";

import { User } from "@/lib/models";
import { IUser } from "@/server/models/user.model";

// Get users by role
export async function getUsersByRole(role: string): Promise<any[]> {
    const users = await User.find({ role }).populate('collage');
    return users.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        collage: {
            _id: (user.collage as any)?._id.toString(),
            logo: (user.collage as any)?.logo,
            english: (user.collage as any)?.english,
            regional: (user.collage as any)?.regional,
            university: (user.collage as any)?.university,
        },
        role: user.role,
        permissions: user?.permissions,
    }));


}

export async function updatePermissions(userId: string, permissions: string[]) {
    const user = await User.findByIdAndUpdate(userId, { permissions });
    return user ? true : false;
}
export const getUsersByCollegeId = async (collegeId: string): Promise<IUser[]> => {
    // Implement the API call to fetch users by college ID
    const response = await fetch(`/api/users?collegeId=${collegeId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch users by college ID');
    }
    return response.json();
};
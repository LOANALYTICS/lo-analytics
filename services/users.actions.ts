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
    try {
        const users = await User.find({ collage: collegeId });
        return JSON.parse(JSON.stringify(users));
    } catch (error: any) {
        throw new Error(`Failed to fetch users by college ID: ${error.message}`);
    }
};


import { Types } from 'mongoose';
const { ObjectId } = Types;

export const assignRoleToUser = async (
    role: string,
    userId: string,
    collegeId: string // still passed in as string
): Promise<{ user?: any; message: string }> => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }
console.log('sfrds',user,user?.collage.toString(), collegeId)
        if (user.collage?.toString() !== collegeId ) {
            throw new Error("User does not belong to the specified college");
        }

        if (user.role === role) {
            return { user, message: "User already has the specified role" };
        }

        if (role === "college_admin") {
            const existingAdmin = await User.findOne({
                collage: collegeId,
                role: "college_admin",
                _id: { $ne: userId } // exclude the current user
            });

            if (existingAdmin) {
                return {
                    message: "Role is already occupied."
                };
            }
        }

        // Optionally log demotion
        const prevRole = user.role;
       
  

        user.role = role;
        await user.save();
        if (prevRole === "college_admin" && role !== "college_admin") {
            return { user: JSON.parse(JSON.stringify(user)), message: "User demoted successfully." };
        }

        return {  user: JSON.parse(JSON.stringify(user)) , message: "Role assigned successfully." };
    } catch (error: any) {
        throw new Error(`Failed to assign role to user: ${error.message}`);
    }
};



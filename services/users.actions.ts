"use server";
import User from "@/server/models/user.model";

// Get users by role
export async function getUsersByRole(role: string): Promise<any[]> {
    const users = await User.find({ role });
    console.log(users)
    return users.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        collage_name: user.collage_name,
        role: user.role,
        permissions: user?.permissions,
    }));


}

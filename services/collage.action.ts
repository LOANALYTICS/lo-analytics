"use server"

import { Collage } from "@/lib/models"




export async function getCollage() {
    const collage = await Collage.find()
    return collage.map((collage:any)=>({
        _id: collage._id.toString(),
        logo:collage.logo,
        english:collage.english,
        regional:collage.regional,
        university:collage.university
    }))
}

export async function createCollage(collage: any) {
    const newCollage = await Collage.create(collage)
    return newCollage ? true : false
}

"use server"

import collageModel from "@/server/models/collage.model"



export async function getCollage() {
    const collage = await collageModel.find()
    return collage.map((collage:any)=>({
        _id: collage._id.toString(),
        logo:collage.logo,
        english:collage.english,
        regional:collage.regional,
        university:collage.university
    }))
}

export async function createCollage(collage: any) {
    const newCollage = await collageModel.create(collage)
    return newCollage ? true : false
}



 import { Prisma } from "@prisma/client";
 import { NextResponse } from "next/server";
 
 export default async function afficher(request){

     const data = await request.json()

     const user = await Prisma.user.create({

        data : {
            nom :data.nom ,
            email :data.email ,
            password :data.password ,
            user_role :data.user_role 
        }
     })

    return NextResponse.json(user ,{status:201})
 }




// pour Server Action travail avec FormData 

// "use server "

// import { Prisma } from "@prisma/client"
// import { create } from "qrcode"
// export default async function afficher(){


//     const nom = FormData.get("nom")
//     const email = FormData.get("email")
//     const password = FormData.get("password")
//     const user_role = FormData.get("user_role")

//     await Prisma.user.create({
//          data: {
//             nom: nom,
//             email: email,
//             password: password,
//             user_role : user_role
//         }
//     })
    
// }       
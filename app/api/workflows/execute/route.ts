import { error } from "console";

export async function GET(request:Request){
    const authHeader=request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer "))
        return Response.json({error:"Unauthorized"},{status:401})

    const secret=authHeader.split(" ")
}
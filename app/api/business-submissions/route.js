import {z} from "zod";
import {connectDB} from "@/lib/db";
import BusinessSubmission from "@/models/BusinessSubmission";
import {apiError,apiSuccess} from "@/lib/api/response";
export const runtime="nodejs";export const dynamic="force-dynamic";
const schema=z.object({businessName:z.string().trim().min(2).max(160),contactName:z.string().trim().min(2).max(120),email:z.string().trim().toLowerCase().email().max(254),phone:z.string().trim().min(7).max(30).regex(/^[+()\d .-]+$/),locationName:z.string().trim().max(120).optional().default(""),categoryName:z.string().trim().max(120).optional().default(""),website:z.string().trim().max(2048).optional().default("").refine(v=>!v||/^https?:\/\//i.test(v)),message:z.string().trim().max(3000).optional().default("")}).strict();
export async function POST(request){
 const origin=request.headers.get("origin");if(origin){try{if(new URL(origin).origin!==new URL(request.url).origin)return apiError("Request origin is not allowed.",403);}catch{return apiError("Invalid request origin.",403);}}
 if((request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase()!=="application/json")return apiError("Content-Type must be application/json.",415);
 const body=await request.json().catch(()=>null);const parsed=schema.safeParse(body);if(!parsed.success)return apiError("Submission details are invalid.",400,parsed.error.issues);
 try{await connectDB();const recent=await BusinessSubmission.countDocuments({email:parsed.data.email,createdAt:{$gte:new Date(Date.now()-3600000)}});if(recent>=3)return apiError("Too many submissions. Please try again later.",429);const item=await BusinessSubmission.create(parsed.data);return apiSuccess({received:true,id:item._id},201);}catch(error){console.error("[SUBMISSION]",error.message);return apiError("Unable to submit your business right now.",500);}
}

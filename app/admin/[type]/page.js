import {redirect} from "next/navigation";
import {getAuthenticatedUser} from "@/lib/auth/session";
import ContentAdminClient from "./content-admin-client";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const metadata={robots:{index:false,follow:false}};
export default async function AdminContentPage({params}){
 const user=await getAuthenticatedUser();
 if(!user)redirect("/admin/login");
 const {type}=await params;
 return <ContentAdminClient type={type}/>;
}

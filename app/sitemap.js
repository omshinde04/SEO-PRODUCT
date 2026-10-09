import {connectDB} from "@/lib/db";
import Business from "@/models/Business";
import Category from "@/models/Category";
import Location from "@/models/Location";
import ContentItem from "@/models/ContentItem";
import {SEOSettings} from "@/models/SEOConfig";
export const dynamic="force-dynamic";
export default async function sitemap(){
 try{
  await connectDB();const [settings,businesses,categories,locations,content]=await Promise.all([
   SEOSettings.findOne({key:"global"}).select("siteUrl sitemapEnabled").lean().exec(),
   Business.find({status:"published","seo.noIndex":{$ne:true}}).select("slug updatedAt").lean().exec(),
   Category.find({status:"active","seo.noIndex":{$ne:true}}).select("slug updatedAt").lean().exec(),
   Location.find({status:"active","seo.noIndex":{$ne:true}}).select("slug updatedAt").lean().exec(),
   ContentItem.find({status:"published","seo.noIndex":{$ne:true}}).select("kind slug updatedAt").lean().exec()
  ]);
  if(settings?.sitemapEnabled===false)return [];
  const base=(settings?.siteUrl||process.env.NEXT_PUBLIC_SITE_URL||"https://gaavconnect.in").replace(/\/$/,"");if(!base||!/^https?:\/\//i.test(base))return [];
  const entries=[{url:base,lastModified:new Date()}];
  for(const x of categories)entries.push({url:base+"/categories/"+x.slug,lastModified:x.updatedAt||new Date()});
  for(const x of locations)entries.push({url:base+"/locations/"+x.slug,lastModified:x.updatedAt||new Date()});
  for(const x of businesses)entries.push({url:base+"/businesses/"+x.slug,lastModified:x.updatedAt||new Date()});
  for(const x of content)entries.push({url:base+"/"+(x.kind==="place"?"places":x.kind==="guide"?"guides":"events")+"/"+x.slug,lastModified:x.updatedAt||new Date()});
  return entries;
 }catch(error){console.error("[SITEMAP]",error.message);return [];}
}

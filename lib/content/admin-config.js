import ContentItem from "@/models/ContentItem";
import BusinessSubmission from "@/models/BusinessSubmission";
import MediaAsset from "@/models/MediaAsset";
import {SEOSettings,SEOTemplate} from "@/models/SEOConfig";
export const ADMIN_RESOURCES=Object.freeze({
 places:{kind:"place",label:"Places",model:ContentItem},
 guides:{kind:"guide",label:"Guides",model:ContentItem},
 events:{kind:"event",label:"Events",model:ContentItem},
 submissions:{label:"Business submissions",model:BusinessSubmission},
 media:{label:"Media library",model:MediaAsset},
 seo:{label:"SEO settings",model:SEOSettings},
 "seo-templates":{label:"SEO templates",model:SEOTemplate}
});
export function isSlug(value){return typeof value==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);}

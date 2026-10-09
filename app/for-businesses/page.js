import PublicInfoPage from "@/components/public-info-page";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";
export const generateMetadata = () => getStaticPageMetadata("/for-businesses");
export default function ForBusinessesPage(){return <PublicInfoPage eyebrow="FOR LOCAL BUSINESS OWNERS" title="Help the right people" highlight="find you." description="Give your shop, service or local business a place in the directory where people can discover what you do and how to get in touch." breadcrumbs={[{label:"For businesses"}]} sections={[
{title:"Create a useful first impression",body:"A clear business name, accurate category, location, description and current contact details help potential customers understand whether your business fits their needs."},
{title:"Share accurate, current details",body:"Submit information you are authorised to share. Keep descriptions factual, use genuine images where requested, and update important details when they change."},
{title:"What happens after submission?",body:"A submitted business is not automatically guaranteed publication. The team may review the information for completeness and suitability before creating or publishing a public listing."},
{title:"Make your public profile work harder",body:"Once a listing is published, a descriptive profile can help people and search engines understand what the business offers. Accurate names, useful descriptions and a correct location are more helpful than repeated keywords."},
{title:"A note about SEO and visibility",body:"GaavConnect is designed to make public listings discoverable, but no directory can guarantee a particular Google ranking, customer count or business outcome."}
]} cta={{eyebrow:"READY WHEN YOU ARE",title:"Put your business on the local map.",description:"Share your business details for review and help people discover what you offer.",href:"/add-business",label:"List your business"}} />}

import PublicInfoPage from "@/components/public-info-page";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";
export const generateMetadata = () => getStaticPageMetadata("/how-it-works");
export default function HowItWorksPage(){return <PublicInfoPage eyebrow="A SIMPLE WAY TO DISCOVER" title="Find what you need," highlight="closer to home." description="Browse local listings with a clear starting point: search by what you need, explore categories, or look through a location." breadcrumbs={[{label:"How it works"}]} sections={[
{title:"Start with a search",body:"Use the business directory to look for a name, service or type of place. Add a location or category when those filters are available to make your search more relevant.",link:{href:"/businesses",label:"Search business listings"}},
{title:"Explore categories",body:"Categories help you move from a broad need to relevant kinds of businesses. Open a category to see the listings currently available for it.",link:{href:"/categories",label:"Browse categories"}},
{title:"Browse by location",body:"Location pages help you focus your discovery on a specific area. Listing availability depends on the information submitted and approved for the directory.",link:{href:"/locations",label:"Explore locations"}},
{title:"Check details before you visit",body:"Read the business profile, review the contact details provided, and confirm opening hours, prices, availability or other time-sensitive details directly with the business when needed."},
{title:"Know a business that should be here?",body:"Help your local business get discovered by sending us its details. Submissions may need review before a listing is published.",link:{href:"/add-business",label:"Submit a business listing"}}
]} cta={{title:"Your next local find starts here.",description:"Search the directory or browse by category and location.",href:"/businesses",label:"Explore businesses"}} />}

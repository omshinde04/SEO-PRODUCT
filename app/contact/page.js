import Link from "next/link";
import PublicInfoPage from "@/components/public-info-page";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";
export const generateMetadata = () => getStaticPageMetadata("/contact");
export default function ContactPage(){return <PublicInfoPage eyebrow="WE'RE HERE TO HELP" title="Let’s get you to the" highlight="right place." description="Choose the route that best matches what you need. We want listing information to be useful and questions to reach the right workflow." breadcrumbs={[{label:"Contact"}]} sections={[
{title:"Questions about a business listing",body:"If a listing is missing important details or you want to suggest a correction, use the business profile as your reference and send the information through the available platform workflow. Please do not send passwords or sensitive personal information.",link:{href:"/businesses",label:"Find a business listing"}},
{title:"Want to add a business?",body:"The business submission form is the right place to share a new listing for review. Include accurate information and only upload material you have permission to use.",link:{href:"/add-business",label:"Submit business details"}},
{title:"Need help using GaavConnect?",body:"For general guidance on searching, browsing categories or submitting a listing, start with the help centre.",link:{href:"/help",label:"Visit the help centre"}},
{title:"Report a safety or accuracy concern",body:"When contacting the team about a listing, provide its name and public page URL plus a concise description of the issue. Do not include payment details, passwords or unrelated sensitive information.",link:{href:"/safety",label:"Read trust and safety guidance"}}
]} />}

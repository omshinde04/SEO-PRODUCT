import PublicInfoPage from "@/components/public-info-page";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";
export const generateMetadata = () => getStaticPageMetadata("/safety");
export default function SafetyPage(){return <PublicInfoPage eyebrow="TRUST & SAFETY" title="Discover with" highlight="confidence." description="Useful local information starts with care. These practical checks can help you make more informed decisions when exploring public business listings." breadcrumbs={[{label:"Trust & safety"}]} sections={[
{title:"Confirm important details directly",body:"Opening hours, prices, stock, appointment availability and service areas can change. Contact the business directly before travelling or making a commitment."},
{title:"Be thoughtful with payments",body:"Understand what you are paying for and confirm the recipient and terms before sending money. Do not share passwords, one-time codes or banking credentials in response to an unsolicited message."},
{title:"Check claims and credentials",body:"A public listing alone does not prove a licence, professional qualification, endorsement or independent verification. For regulated or specialist services, check the relevant credentials with the appropriate source."},
{title:"Respect privacy",body:"Only submit personal information needed for the listing or support request. Do not publish someone else’s private contact details, photographs or documents without permission."},
{title:"Flag information that appears wrong",body:"If a listing looks misleading, outdated or inappropriate, record its public URL and the specific concern and use the available contact route. Avoid sharing sensitive details in a public comment.",link:{href:"/contact",label:"Find contact guidance"}}
]} />}

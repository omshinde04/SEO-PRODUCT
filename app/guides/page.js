import Link from "next/link";
import PublicInfoPage from "@/components/public-info-page";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";
export const generateMetadata = () => getStaticPageMetadata("/guides");
const guides=[
{n:"01",title:"How to choose a local service",desc:"Questions to ask before you book, visit or hire a service provider.",href:"/guides/choosing-a-local-service"},
{n:"02",title:"What makes a useful business listing?",desc:"The details that help people understand what a business offers.",href:"/guides/useful-business-listing"},
{n:"03",title:"A checklist before visiting a business",desc:"Simple checks for hours, location, availability and contact details.",href:"/guides/before-you-visit"},
{n:"04",title:"Help your local business get discovered",desc:"Practical ways to keep your business information clear and consistent.",href:"/guides/business-discovery-basics"}
];
export default function GuidesPage(){return <><PublicInfoPage eyebrow="THE GAAVCONNECT FIELD NOTES" title="A little local knowledge" highlight="goes a long way." description="Practical, evergreen guidance for discovering services, choosing businesses and making your own business easier to understand online." breadcrumbs={[{label:"Local guides"}]} sections={[
{title:"Useful answers, not keyword pages",body:"These guides are designed to answer real questions. Each guide should be reviewed and improved as the directory and local community grow."},
{title:"Start with a question",body:"Choose the guide that fits your next step. Always confirm time-sensitive or important details directly with the business."}
]} cta={{title:"Ready to explore actual listings?",description:"Move from advice to businesses, categories and locations in the directory.",href:"/businesses",label:"Explore the directory"}}/><section className="guide-index"><div className="guide-index-heading"><span className="info-eyebrow">BROWSE THE FIELD NOTES</span><h2>Small guides. <em>Useful next steps.</em></h2></div><div className="guide-index-grid">{guides.map(g=><article className="guide-index-card" key={g.n}><span>{g.n}</span><h3>{g.title}</h3><p>{g.desc}</p><Link href={g.href}>Read guide <b aria-hidden="true">↗</b></Link></article>)}</div><p className="guide-index-note">Each guide contains practical steps you can use now. We will continue reviewing and improving these resources as the directory grows.</p></section></>}

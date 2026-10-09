import PublicInfoPage from "@/components/public-info-page";
import { getStaticPageMetadata } from "@/lib/seo/static-pages";
export const generateMetadata = () => getStaticPageMetadata("/accessibility");
export default function AccessibilityPage(){return <PublicInfoPage eyebrow="ACCESSIBILITY" title="Local discovery should be for" highlight="everyone." description="We want GaavConnect to be clear, readable and usable across devices and input methods. Accessibility is ongoing work, not a one-time checklist." breadcrumbs={[{label:"Accessibility"}]} sections={[
{title:"What we aim for",body:"We aim for readable contrast, clear navigation, descriptive page titles, responsive layouts, labelled form controls and interfaces that can be used with a keyboard wherever practical."},
{title:"A work in progress",body:"Not every page or third-party feature has been independently audited. We are working toward more consistent semantic structure, focus visibility, helpful error messages and support for assistive technology."},
{title:"If you encounter a barrier",body:"If a control is difficult to use, content is unreadable, or a page does not work with your device or assistive technology, please share the page URL and a short description through the contact route.",link:{href:"/contact",label:"Contact guidance"}},
{title:"Helpful browsing options",body:"You may be able to improve readability using your browser’s zoom, text-size, contrast or reader features. The website should continue to work at common mobile and desktop widths."}
]} />}

import { StickyBar } from "@/components/layout/StickyBar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StickyInquirePill } from "@/components/layout/StickyInquirePill";
import { QuizPopup } from "@/components/quiz/QuizPopup";
import { siteConfig } from "@/lib/site.config";
import { getAllPosts } from "@/lib/posts";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const hasPosts = getAllPosts().length > 0;
  return (
    <>
      {siteConfig.announcement && <StickyBar {...siteConfig.announcement} />}
      <Navbar brandName={siteConfig.brand.name} showJournal={hasPosts} />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer
        studioName={siteConfig.brand.name}
        socials={siteConfig.socials}
        tagline={siteConfig.brand.tagline}
        contact={{
          phone: siteConfig.brand.phone,
          email: siteConfig.brand.email,
          location: siteConfig.brand.location
            ? `${siteConfig.brand.location.city}, ${siteConfig.brand.location.state}`
            : undefined,
          mapsUrl: siteConfig.brand.location?.mapUrl,
        }}
        navLinks={siteConfig.footerLinks}
      />
      {/* Persistent mobile-only CTA (homepage) — desktop has the Navbar CTA. */}
      <StickyInquirePill label="Inquire" />
      {/* Self-gated: renders null unless siteConfig.quiz is enabled. */}
      <QuizPopup />
    </>
  );
}

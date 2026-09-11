import { Suspense } from "react";
import { SiteEntrance } from "@/components/site-entrance";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<SiteChrome>{children}</SiteChrome>}>
      <SiteEntrance>
        <SiteChrome>{children}</SiteChrome>
      </SiteEntrance>
    </Suspense>
  );
}

import type { Metadata } from "next";
import { HelloExperience } from "@/components/hello-experience";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Welcome · ${SITE_NAME}`,
  description:
    "First time in BK. A student room to talk without the side-eye.",
};

export default function HelloPage() {
  return <HelloExperience />;
}

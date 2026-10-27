import type { Metadata } from "next";
import { HackathonDemoClient } from "./HackathonDemoClient";

export const metadata: Metadata = {
  title: "Global Stock — Demo del hackathon",
  description: "Demo integrada de Global Stock, Global Intelligence y PayPal Developer Sandbox.",
  robots: { index: false, follow: false }
};

export default function HackathonDemoPage() {
  return <HackathonDemoClient />;
}

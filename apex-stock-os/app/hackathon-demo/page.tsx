import { redirect } from "next/navigation";

export const metadata = {
  title: "Global Stock — Demo del hackathon",
  description: "Demo pública de Global Stock con datos de ejemplo y PayPal Developer Sandbox.",
  robots: { index: false, follow: false }
};

export default function HackathonDemoPage() {
  redirect("/?hackathon-demo=1");
}

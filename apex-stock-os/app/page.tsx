import { ApexShell } from "@/components/ApexShell";

/**
 * Desktop and notebook use their own responsive Global Stock dashboard.
 * Expo Go keeps its native screen/layout; both share Supabase businesses,
 * inventory, permissions and server APIs. Do not redirect desktop to Expo Web.
 */
export default function HomePage() {
  return <ApexShell />;
}

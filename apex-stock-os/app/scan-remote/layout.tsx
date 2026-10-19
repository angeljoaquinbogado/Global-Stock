import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lector remoto | Global Stock",
  robots: { index: false, follow: false }
};

export default function RemoteScannerLayout({children}:{children:React.ReactNode}){
  return children;
}

import { AdminApp } from "@/components/AdminApp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "High Five Admin (dummy)",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminApp />;
}

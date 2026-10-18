import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MainNav } from "@/components/layout/main-nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <MainNav user={session.user} />
      {/* top nav on wide screens, bottom app bar on phones */}
      <main className="pb-16 sm:pb-0 sm:pt-16">{children}</main>
    </div>
  );
}

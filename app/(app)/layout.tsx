import { Sidebar } from "@/components/Sidebar";
import { AuthGuard } from "@/components/AuthGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="app-shell min-h-screen">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

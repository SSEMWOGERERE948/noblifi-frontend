import { Sidebar } from "@/components/Sidebar";
import { AuthGuard } from "@/components/AuthGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="app-shell min-h-screen">
        <div className="flex">
          <Sidebar />
          <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}


import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mode ciut sidebar (desktop) disimpan di localStorage agar tetap setelah reload
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", String(collapsed));
    } catch {
      // abaikan jika localStorage tidak tersedia
    }
  }, [collapsed]);

  return (
    <div className="relative min-h-screen bg-[#060606] text-white">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div
        className={`relative z-10 min-h-screen ${
          collapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"
        }`}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="min-h-[calc(100vh-70px)] p-4 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Server, ClipboardList, Users, Building2, BookText, Settings } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard", end: true },
  { to: "/systemer", label: "Systemer", icon: Server, testid: "nav-systemer" },
  { to: "/opgaver", label: "Opgaver", icon: ClipboardList, testid: "nav-opgaver" },
  { to: "/kontakter", label: "Kontakter", icon: Users, testid: "nav-kontakter" },
  { to: "/organisationer", label: "Organisationer", icon: Building2, testid: "nav-organisationer" },
  { to: "/logbog", label: "Logbog", icon: BookText, testid: "nav-logbog" },
  { to: "/indstillinger", label: "Indstillinger", icon: Settings, testid: "nav-indstillinger" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-stone-50">
      <aside
        className="w-64 h-screen fixed inset-y-0 left-0 border-r border-slate-200 bg-white flex flex-col z-40"
        data-testid="sidebar"
      >
        <div className="px-6 py-6 border-b border-slate-200">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-medium">Systemforvalter</div>
          <div className="mt-1 font-heading text-lg font-semibold text-slate-900">Overblik</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, testid, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-slate-200 text-xs text-slate-500">
          Personligt arbejdsredskab · v1
        </div>
      </aside>

      <main className="ml-64 p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

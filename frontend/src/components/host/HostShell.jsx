import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, TrendingUp, Sparkles, Bot, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function HostShell({ children }) {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: "/host", label: t("host_dashboard"), icon: LayoutDashboard },
    { path: "/host/property", label: t("host_property"), icon: Building2 },
    { path: "/host/pricing", label: t("host_pricing"), icon: TrendingUp },
    { path: "/host/listing", label: t("host_listing"), icon: Sparkles },
    { path: "/host/assistant", label: t("host_assistant"), icon: Bot },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {/* HOST HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-pine p-6 text-cream shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-copper/20 px-3 py-1 text-xs font-semibold text-copper">
            <ShieldCheck className="h-4 w-4" />
            <span>SETUVIA Host Growth Toolkit</span>
          </div>
          <h1 className="mt-2 font-display text-2xl md:text-4xl font-bold">
            Host Growth & Property Hub 🏠
          </h1>
          <p className="mt-1 text-xs md:text-sm text-sand/80">
            Manage your GTDC & verified heritage stays, optimize pricing, and generate AI-enhanced listings.
          </p>
        </div>

        <Link
          to="/"
          className="self-start md:self-center shrink-0 rounded-full bg-cream px-4 py-2 text-xs font-bold text-pine hover:bg-sand transition shadow-sm"
        >
          ← Traveller Mode
        </Link>
      </div>

      {/* HOST TABS NAVIGATION */}
      <div className="mt-6 flex overflow-x-auto gap-2 border-b border-sand pb-3 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition shrink-0 ${
                isActive
                  ? "bg-pine text-cream shadow-md"
                  : "bg-paper border border-sand text-ink hover:bg-sand/60"
              }`}
            >
              <Icon className="h-4 w-4 text-copper" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* HOST CONTENT BODY */}
      <div className="mt-8">{children}</div>
    </div>
  );
}

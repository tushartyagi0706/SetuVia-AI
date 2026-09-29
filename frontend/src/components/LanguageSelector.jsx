import { Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function LanguageSelector({ compact = false }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5">
      <Globe className="h-4 w-4 text-copper shrink-0" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={`rounded-lg border border-sand bg-paper text-ink font-medium outline-none focus:ring-2 focus:ring-pine transition ${
          compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs"
        }`}
        aria-label="Select Language"
      >
        <option value="en">English (EN)</option>
        <option value="hi">हिंदी (HI)</option>
        <option value="kok">कोंकणी (KOK)</option>
      </select>
    </div>
  );
}

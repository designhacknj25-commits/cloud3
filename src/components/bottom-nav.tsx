"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  LayoutDashboard,
  HelpCircle,
  Send,
  Bell
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/registrations", label: "Registrations", icon: BookOpen },
  { href: "/student/ask", label: "Ask", icon: Send },
  { href: "/student/faq", label: "FAQ", icon: HelpCircle },
];

const teacherNav = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/events", label: "Events", icon: Calendar },
  { href: "/teacher/assistant", label: "Inbox", icon: Bell },
];

export function BottomNav() {
  const role = useUserRole();
  const pathname = usePathname();

  const navItems = role === "teacher" ? teacherNav : studentNav;

  if (!role) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-t z-50">
      <nav className="h-full">
        <ul className="h-full flex items-center justify-around">
          {navItems.map((item) => (
            <li key={item.href} className="h-full flex-1">
              <Link
                href={item.href}
                className={cn(
                  "h-full flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

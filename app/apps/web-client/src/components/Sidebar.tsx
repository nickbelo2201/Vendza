"use client";

import { ShoppingBag, Tag, MapPin, Settings, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/pedidos", label: "Meus Pedidos", Icon: ShoppingBag },
  { href: "/cupons", label: "Cupons", Icon: Tag },
  { href: "/enderecos", label: "Endereços", Icon: MapPin },
  { href: "/configuracoes", label: "Configurações", Icon: Settings },
  { href: "/sair", label: "Sair", Icon: LogOut },
];

export function Sidebar() {
  return (
    <aside className="wc-sidebar">
      <div className="wc-sidebar-user">
        <div className="wc-sidebar-avatar">V</div>
        <div className="wc-sidebar-user-info">
          <span className="wc-sidebar-user-name">Minha Conta</span>
          <span className="wc-sidebar-user-email">Bem-vindo!</span>
        </div>
      </div>

      <div className="wc-sidebar-divider" />

      <nav className="wc-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <a key={item.href} href={item.href} className="wc-sidebar-nav-item">
            <span className="wc-sidebar-nav-icon">
              <item.Icon size={16} strokeWidth={1.75} />
            </span>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

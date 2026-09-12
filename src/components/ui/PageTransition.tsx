import type { ReactNode } from "react";

export function PageTransition({ children, stagger }: { children: ReactNode; stagger?: boolean }) {
  return <div className={stagger ? "page-enter page-enter-stagger" : "page-enter"}>{children}</div>;
}

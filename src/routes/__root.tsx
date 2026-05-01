import { useEffect } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AppShell } from "@/components/layout/AppShell";
import { registerOfflineServiceWorker } from "@/lib/registerSW";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Go to dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AMCE Microbiology Inventory & Supply Management" },
      { name: "description", content: "Inventory, supply status, batch tracking, acceptance testing and equipment management for AMCE Abuja, Department of Medical Microbiology and Immunology." },
      { name: "author", content: "AMCE Abuja" },
      { property: "og:title", content: "AMCE Microbiology Inventory & Supply Management" },
      { name: "twitter:title", content: "AMCE Microbiology Inventory & Supply Management" },
      { property: "og:description", content: "Inventory, supply status, batch tracking, acceptance testing and equipment management for AMCE Abuja, Department of Medical Microbiology and Immunology." },
      { name: "twitter:description", content: "Inventory, supply status, batch tracking, acceptance testing and equipment management for AMCE Abuja, Department of Medical Microbiology and Immunology." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bcf0b153-0ebc-40b1-9015-4a7ea83f5fba/id-preview-05f4f8a0--7c6c1f81-c72f-4335-b819-b626b7990fc1.lovable.app-1777626952420.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bcf0b153-0ebc-40b1-9015-4a7ea83f5fba/id-preview-05f4f8a0--7c6c1f81-c72f-4335-b819-b626b7990fc1.lovable.app-1777626952420.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    registerOfflineServiceWorker();
  }, []);
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

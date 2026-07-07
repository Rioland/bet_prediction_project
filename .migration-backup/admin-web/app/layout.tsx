import "./globals.css";
import { PropsWithChildren } from "react";

import { Providers } from "@/components/layout/providers";

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

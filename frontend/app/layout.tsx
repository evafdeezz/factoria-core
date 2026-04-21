import "./globals.css";
import { CurrentUserProvider } from "@/components/CurrentUserProvider";

export const metadata = {
  title: "Factoría Core",
  description: "Sistema de gestión para grupos de entrenamiento",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-100">
        <CurrentUserProvider>{children}</CurrentUserProvider>
      </body>
    </html>
  );
}
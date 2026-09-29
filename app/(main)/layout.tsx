import MainLayout from "@/src/template/MainLayout";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <MainLayout>{children}</MainLayout>;
}

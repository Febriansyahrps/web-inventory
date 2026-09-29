import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import { ConfigProvider } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { NotificationProvider } from "@/src/molecules/Notification";

const globalFont = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-global", // Defines the CSS variable
});

export const metadata: Metadata = {
  title: {
    default: "Inventaris SMK Tamansiswa Banjarnegara",
    template: "%s | Inventaris SMK Tamansiswa Banjarnegara",
  },
  description:
    "Sistem Informasi Pencatatan Inventaris SMK Tamansiswa Banjarnegara",
  // Private app — never index or follow.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${globalFont.variable} h-full antialiased bg-[#F2EDE3]!`}
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning={true}
      >
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimaryBorder: "none",
                colorPrimary: "#A2850F",
                colorBgLayout: "transparent",
                // Disabled inputs keep a transparent background and normal text
                // colour (read-only forms look like plain, readable fields).
                colorBgContainerDisabled: "transparent",
                colorTextDisabled: "rgba(0, 0, 0, 0.88)",
              },
              components: {
                Layout: {
                  headerBg: "transparent",
                  siderBg: "transparent",
                },
                Menu: {
                  itemColor: "#8A8A8A",
                },
                Button: {
                  fontSize: 14,
                  paddingInline: 16,
                  padding: 20,
                  controlHeight: 36,
                },
              },
            }}
          >
            <NotificationProvider>{children}</NotificationProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

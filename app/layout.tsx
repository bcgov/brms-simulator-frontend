import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import theme from "./styles/themeConfig";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/globals.css";
import styles from "./styles/layout.module.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Business Rules Management App (SDPR)",
    default: "Business Rules Management App (SDPR)",
  },
  description: "System for creating and simulating results for SDPR Business Rules",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            <ErrorBoundary>
              <App>
                <div className={styles.layoutWrapper}>{children}</div>
              </App>
            </ErrorBoundary>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

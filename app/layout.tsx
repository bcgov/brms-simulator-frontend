import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import theme from "./styles/themeConfig";
import "./styles/globals.css";
import styles from "./styles/layout.module.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BRMS Simulation System MVP (SDPR)",
  description: "System for simulating results for SDPR Business Rules",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            <div className={styles.layoutWrapper}>{children}</div>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

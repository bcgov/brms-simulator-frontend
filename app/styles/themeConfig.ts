import type { ThemeConfig } from "antd";

const theme: ThemeConfig = {
  token: {},
  components: {
    Table: {
      headerBorderRadius: 0,
      rowHoverBg: "#f7f9fc",
    },
    Select: {
      optionFontSize: 16,
    },
    List: {
      itemPaddingSM: "4px 0px",
    },
  },
};

export default theme;

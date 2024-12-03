import axios from "axios";

export const TEMP_REFRESH_TOKEN = "PUT_REFRESH_TOKEN_FROM_INSOMNIA_HERE";

const WORKSPACE = "dev_sadmin_bre_poc";
const VIEW_MODE = "Organization";

interface APICall {
  url: string;
  searchField?: string;
  searchText?: string;
  renderLabel?: (item: any) => string;
}

interface APICallForList extends APICall {
  keyString?: string;
  valueString?: string;
}

export default class ICMIntegrationAPI {
  refreshToken = TEMP_REFRESH_TOKEN;
  identityToken = null;

  constructor() {
    this.refreshIdentityToken();
  }

  refreshIdentityToken = async () => {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/icmIntegration/getRefreshToken/${this.refreshToken}`
    );
    this.refreshToken = data.refresh_token;
    this.identityToken = data.id_token;
  };

  callAPI = async ({ url, searchField = "Id", searchText }: APICall) => {
    const apiUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/icmIntegration${url}`;
    const params: any = {
      ViewMode: VIEW_MODE,
      workspace: WORKSPACE,
      identityToken: this.identityToken,
    };
    if (searchText && searchField) {
      params.searchspec = `([${searchField}] = '${searchText}')`;
    }
    const { data } = await axios.get(apiUrl, { params });

    return data;
  };

  callAPIForList = async ({
    url,
    keyString = "Id",
    valueString = "Id",
    renderLabel,
    searchField,
    searchText,
  }: APICallForList) => {
    let data = await this.callAPI({ url, searchField, searchText });
    if (!data) {
      return [{}];
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    return data
      .filter((item: any) => item[keyString])
      .map((item: any) => {
        return {
          key: item[keyString],
          value: item[valueString],
          label: renderLabel ? renderLabel(item) : item[valueString],
        };
      });
  };
}

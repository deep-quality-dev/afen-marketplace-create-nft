import { api } from "../../utils/axios";
import { IAssetData, IParsedTx, IGasPrices } from "../../types/WalletConnect";
import { User } from "./types/User";

export async function getUser(address: string): Promise<User> {
  const response = await api.get(`/user/${address}`);
  return response.data?.user;
}

export async function createUser(data: User): Promise<User> {
  const response = await api.post("/user/register", JSON.stringify(data), {
    headers: {
      "content-type": "multipart/form-data",
    },
  });
  const { result } = response.data;
  return result;
}

export async function updateUser() {
  // TODO
}

export async function deleteUser() {
  // TODO
}

export async function apiGetAccountAssets(
  address: string,
  chainId: number
): Promise<IAssetData[]> {
  const response = await api.get(
    `/account-assets?address=${address}&chainId=${chainId}`
  );
  const { result } = response.data;
  return result;
}

export async function apiGetAccountTransactions(
  address: string,
  chainId: number
): Promise<IParsedTx[]> {
  const response = await api.get(
    `/account-transactions?address=${address}&chainId=${chainId}`
  );
  const { result } = response.data;
  return result;
}

export const apiGetAccountNonce = async (
  address: string,
  chainId: number
): Promise<string> => {
  const response = await api.get(
    `/account-nonce?address=${address}&chainId=${chainId}`
  );
  const { result } = response.data;
  return result;
};

export const apiGetGasPrices = async (): Promise<IGasPrices> => {
  const response = await api.get(`/gas-prices`);
  const { result } = response.data;
  return result;
};

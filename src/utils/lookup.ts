import axios from "axios";
import Cookies from "js-cookie";

export interface LookupItem {
  id: number;
  name: string;
}

export interface LookupResponse {
  message?: string;
  description?: string;
}

export type LookupEntity = "kategori" | "lokasi" | "asal" | "keadaan" | "satuan";

/** Entity key -> the path segment used by the /api/{add,update,delete}-*-barang routes. */
const ENTITY_PATH: Record<LookupEntity, string> = {
  kategori: "kategori-barang",
  lokasi: "lokasi-barang",
  asal: "asal-barang",
  keadaan: "keadaan-barang",
  satuan: "satuan-barang",
};

export const LOOKUP_LABEL: Record<LookupEntity, string> = {
  kategori: "Kategori",
  lokasi: "Lokasi",
  asal: "Asal",
  keadaan: "Keadaan",
  satuan: "Satuan",
};

const authHeaders = () => {
  const token = Cookies.get("auth-token");
  return { Authorization: token ? `Bearer ${token}` : undefined };
};

export async function addLookup(
  entity: LookupEntity,
  name: string,
): Promise<LookupResponse> {
  const { data } = await axios.post<LookupResponse>(
    `/api/add-${ENTITY_PATH[entity]}`,
    { name },
    { headers: authHeaders() },
  );
  return data;
}

export async function updateLookup(
  entity: LookupEntity,
  id: number,
  name: string,
): Promise<LookupResponse> {
  const { data } = await axios.patch<LookupResponse>(
    `/api/update-${ENTITY_PATH[entity]}/${id}`,
    { name },
    { headers: authHeaders() },
  );
  return data;
}

export async function deleteLookup(
  entity: LookupEntity,
  id: number,
): Promise<LookupResponse> {
  const { data } = await axios.delete<LookupResponse>(
    `/api/delete-${ENTITY_PATH[entity]}/${id}`,
    { headers: authHeaders() },
  );
  return data;
}

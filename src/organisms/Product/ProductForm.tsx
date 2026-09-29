"use client";

import DeleteProductModal from "@/src/molecules/DeleteProductModal";
import Notification from "@/src/molecules/Notification";
import LookupSelect from "@/src/molecules/LookupSelect";
import { preventNonNumeric } from "@/src/utils/number";
import { useAsalStore } from "@/store/useAsalStore";
import { useKategoryStore } from "@/store/useKategoryStore";
import { useLokasiStore } from "@/store/useLokasiStore";
import { useKeadaanStore } from "@/store/UseKeadaanStore";
import { useSatuanStore } from "@/store/useSatuanStore";
import type { Product } from "@/store/useProductStore";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Upload,
} from "antd";
import type { FormProps, UploadFile } from "antd";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ProductFormValues {
  nama_barang: string;
  kode_barang: string;
  no_register: string;
  id_kategori_barang: number;
  id_lokasi_barang?: number;
  id_asal_barang: number;
  id_keadaan_barang: number;
  id_satuan_barang: number;
  merk_barang?: string;
  no_sertifikat?: string;
  bahan?: string;
  tahun_perolehan?: number;
  ukuran_barang?: string;
  jumlah_barang: number;
  harga_barang: number;
  foto?: UploadFile[];
}

interface ProductFormProps {
  isAddProduct?: boolean;
  productId?: number;
}

// On update, an empty value here clears the column to null; for every other
// field an empty value is left out so the API doesn't reject it.
const CLEARABLE_ON_UPDATE = [
  "merk_barang",
  "no_sertifikat",
  "bahan",
  "ukuran_barang",
  "tahun_perolehan",
];

// Upload owns its fileList, so pull it out of the raw change event for the form.
// Only the most recent file is kept, so this can never hold more than one.
const normFile = (e: { fileList: UploadFile[] } | UploadFile[]) => {
  const fileList = Array.isArray(e) ? e : (e?.fileList ?? []);
  return fileList.slice(-1);
};

// Year options for "Tahun Perolehan", newest first.
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 51 }, (_, i) => CURRENT_YEAR - i).map(
  (year) => ({ value: year, label: String(year) }),
);

const ProductForm = ({ isAddProduct = true, productId }: ProductFormProps) => {
  const isAdd = isAddProduct;
  const router = useRouter();
  // Role cookie holds the role id; "1" is ADMIN. Same gate as Header/ProductTable.
  // Non-admins get a read-only detail view (the add/update routes reject them).
  const readOnly = Cookies.get("role") !== "1";
  const [form] = Form.useForm<ProductFormValues>();
  const [loading, setLoading] = useState(false);
  // Starts true when editing so the detail fetch never setState synchronously.
  const [fetching, setFetching] = useState(!isAdd);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);

  const fetchKategori = useKategoryStore((state) => state.fetchKategori);
  const listKategori = useKategoryStore((state) => state.list);
  const fetchLokasi = useLokasiStore((state) => state.fetchLokasi);
  const listLokasi = useLokasiStore((state) => state.list);
  const fetchAsal = useAsalStore((state) => state.fetchAsal);
  const listAsal = useAsalStore((state) => state.list);
  const fetchKeadaan = useKeadaanStore((state) => state.fetchKeadaan);
  const listKeadaan = useKeadaanStore((state) => state.list);
  const fetchSatuan = useSatuanStore((state) => state.fetchSatuan);
  const listSatuan = useSatuanStore((state) => state.list);
  const fetchRef = useRef(false);

  useEffect(() => {
    if (!fetchRef.current) {
      if (listAsal.length < 1) fetchAsal();
      if (listKategori.length < 1) fetchKategori();
      if (listLokasi.length < 1) fetchLokasi();
      if (listKeadaan.length < 1) fetchKeadaan();
      if (listSatuan.length < 1) fetchSatuan();
      fetchRef.current = true;
    }
  }, [
    fetchAsal,
    fetchKategori,
    fetchLokasi,
    fetchKeadaan,
    fetchSatuan,
    listAsal.length,
    listKategori.length,
    listLokasi.length,
    listKeadaan.length,
    listSatuan.length,
  ]);

  // Edit mode: load the product and prefill the form.
  useEffect(() => {
    if (isAdd || !productId) return;

    let active = true;

    const fetchDetail = async () => {
      try {
        const token = Cookies.get("auth-token");
        const { data } = await axios.get<{ data: Product }>(
          `/api/product/${productId}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          },
        );
        if (!active) return;

        const product = data.data;
        const foto: UploadFile[] = product.foto_barang
          ? [
              {
                uid: "-1",
                name: product.foto_barang.split("/").pop() ?? "foto",
                status: "done",
                url: product.foto_barang,
              },
            ]
          : [];

        form.setFieldsValue({
          nama_barang: product.nama_barang,
          kode_barang: product.kode_barang,
          no_register: product.no_register,
          no_sertifikat: product.no_sertifikat ?? undefined,
          id_kategori_barang: product.kategori_barang?.id,
          id_lokasi_barang: product.lokasi_barang?.id,
          id_asal_barang: product.asal_barang?.id,
          id_keadaan_barang: product.keadaan_barang?.id,
          id_satuan_barang: product.satuan_barang?.id,
          merk_barang: product.merk_barang ?? undefined,
          bahan: product.bahan ?? undefined,
          ukuran_barang: product.ukuran_barang ?? undefined,
          tahun_perolehan: product.tahun_perolehan ?? undefined,
          jumlah_barang: product.jumlah_barang,
          harga_barang: product.harga_barang,
          foto,
        });
        setExistingPhoto(product.foto_barang);
      } catch (err) {
        if (!active) return;
        Notification({
          type: "error",
          title: "Gagal Memuat Barang",
          description:
            axios.isAxiosError(err) && err.response?.data?.message
              ? err.response.data.message
              : "Terjadi kesalahan, coba lagi",
        });
      } finally {
        if (active) setFetching(false);
      }
    };

    fetchDetail();

    return () => {
      active = false;
    };
  }, [isAdd, productId, form]);

  const buildFormData = (values: ProductFormValues) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "foto") return;
      const isEmpty = value === undefined || value === null || value === "";
      // Add requires every field it sends; update sends only what changed.
      if (isEmpty && (isAdd || !CLEARABLE_ON_UPDATE.includes(key))) return;
      formData.append(key, isEmpty ? "" : String(value));
    });

    const foto = values.foto?.[0]?.originFileObj;
    if (foto) {
      formData.append("foto", foto);
    } else if (!isAdd && existingPhoto && (values.foto?.length ?? 0) === 0) {
      // Existing photo removed without a replacement → tell the API to delete it.
      formData.append("delete_foto", "true");
    }

    return formData;
  };

  const onFinishHandler: FormProps<ProductFormValues>["onFinish"] = async (
    values,
  ) => {
    setLoading(true);

    try {
      const token = Cookies.get("auth-token");
      const formData = buildFormData(values);
      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      };

      const { data } = isAdd
        ? await axios.post("/api/add-product", formData, config)
        : await axios.patch(
            `/api/update-product/${productId}`,
            formData,
            config,
          );

      Notification({
        type: "success",
        title: data.message,
        description: data.description,
      });

      if (isAdd) form.resetFields();
      router.push("/barang");
    } catch (err) {
      Notification({
        type: "error",
        title: isAdd ? "Gagal Menyimpan Barang" : "Gagal Mengubah Barang",
        description:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Terjadi kesalahan, coba lagi",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      loading={fetching}
      className="mt-6! max-[575px]:mt-4!"
      classNames={{ body: "max-[575px]:px-3! max-[575px]:py-4!" }}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={onFinishHandler}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold ">
            {isAdd ? "Tambah Barang" : "Detail Barang"}
          </h1>
          {!isAdd && !readOnly && (
            <Button
              icon={<DeleteOutlined />}
              type="primary"
              danger
              ghost
              onClick={() => setDeleteModal(true)}
            >
              Hapus <span className="max-[575px]:hidden!">Barang</span>
            </Button>
          )}
        </div>
        <Divider />
        <div>
          <h2 className="text-[16px] font-medium">Informasi Umum</h2>
          <Row gutter={16} className="mt-2">
            <Col xs={24} md={24}>
              <Form.Item
                label="Nama Barang"
                name="nama_barang"
                rules={[
                  { required: true, message: "Mohon masukan nama barang!" },
                ]}
              >
                <Input
                  size="large"
                  disabled={readOnly}
                  placeholder="Masukan nama barang"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Kode Barang" name="kode_barang">
                <Input
                  size="large"
                  disabled={readOnly}
                  placeholder="Masukan kode barang"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Nomor Registrasi" name="no_register">
                <Input
                  size="large"
                  disabled={readOnly}
                  placeholder="Masukan nomor registrasi"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Nomor Sertifikat" name="no_sertifikat">
                <Input
                  size="large"
                  disabled={readOnly}
                  placeholder="Masukan nomor sertifikat"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Kategori" name="id_kategori_barang">
                <LookupSelect
                  entity="kategori"
                  list={listKategori}
                  onRefresh={fetchKategori}
                  size="large"
                  showSearch
                  allowClear
                  disabled={readOnly}
                  placeholder="Pilih kategori barang"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Lokasi Penempatan" name="id_lokasi_barang">
                <LookupSelect
                  entity="lokasi"
                  list={listLokasi}
                  onRefresh={fetchLokasi}
                  size="large"
                  showSearch
                  allowClear
                  disabled={readOnly}
                  placeholder="Pilih lokasi barang"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
        <Divider />

        <div>
          <h2 className="text-[16px] font-medium">Data Perolehan</h2>
          <Row gutter={16} className="mt-2">
            <Col xs={24} md={12}>
              <Form.Item label="Asal Barang" name="id_asal_barang">
                <LookupSelect
                  entity="asal"
                  list={listAsal}
                  onRefresh={fetchAsal}
                  size="large"
                  showSearch
                  allowClear
                  disabled={readOnly}
                  placeholder="Pilih asal barang"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tahun Perolehan" name="tahun_perolehan">
                <Select
                  size="large"
                  showSearch
                  allowClear
                  disabled={readOnly}
                  placeholder="Pilih tahun perolehan"
                  options={YEAR_OPTIONS}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
        <Divider />
        <div>
          <h2 className="text-[16px] font-medium">Spesifikasi dan Kondisi</h2>
          <Row gutter={16} className="mt-2">
            <Col xs={24} md={12}>
              <Form.Item label="Merk" name="merk_barang">
                <Input
                  size="large"
                  disabled={readOnly}
                  placeholder="Masukan merk barang"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Bahan" name="bahan">
                <Input
                  size="large"
                  disabled={readOnly}
                  placeholder="Masukan bahan barang"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Satuan" name="id_satuan_barang">
                <LookupSelect
                  entity="satuan"
                  list={listSatuan}
                  onRefresh={fetchSatuan}
                  size="large"
                  showSearch
                  allowClear
                  disabled={readOnly}
                  placeholder="Pilih satuan barang"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Ukuran" name="ukuran_barang">
                <Input
                  size="large"
                  disabled={readOnly}
                  placeholder="Masukan ukuran barang"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Keadaan" name="id_keadaan_barang">
                <LookupSelect
                  entity="keadaan"
                  list={listKeadaan}
                  onRefresh={fetchKeadaan}
                  size="large"
                  showSearch
                  allowClear
                  disabled={readOnly}
                  placeholder="Pilih keadaan barang"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
        <Divider />
        <div>
          <h2 className="text-[16px] font-medium">Jumlah dan Nilai</h2>
          <Row gutter={16} className="mt-2">
            <Col xs={24} md={12}>
              <Form.Item label="Jumlah Barang" name="jumlah_barang">
                <InputNumber
                  size="large"
                  className="w-full!"
                  min={0}
                  precision={0}
                  controls={false}
                  disabled={readOnly}
                  placeholder="Masukan jumlah barang"
                  onKeyDown={preventNonNumeric}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Total Harga Barang" name="harga_barang">
                <InputNumber<number>
                  size="large"
                  className="w-full!"
                  prefix="Rp"
                  min={0}
                  controls={false}
                  disabled={readOnly}
                  placeholder="Masukan harga barang"
                  onKeyDown={preventNonNumeric}
                  formatter={(value) =>
                    value === undefined || value === null
                      ? ""
                      : Number(value).toLocaleString("id-ID")
                  }
                  parser={(value) => Number(value?.replace(/\D/g, "") || 0)}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />
        <div>
          <h2 className="text-[16px] font-medium">Dokumentasi</h2>
          <Row gutter={16} className="mt-2">
            <Col xs={24}>
              <Form.Item
                label="Foto Barang"
                name="foto"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                extra="Format JPEG, PNG, atau WebP"
              >
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  multiple={false}
                  disabled={readOnly}
                  accept="image/jpeg,image/png,image/webp"
                  listType="picture-card"
                >
                  <UploadOutlined />
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {readOnly ? (
          <p className="text-sm text-gray-500">
            Hanya admin yang dapat mengubah data barang.
          </p>
        ) : (
          <div className="flex justify-end">
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
            >
              Simpan Barang
            </Button>
          </div>
        )}
      </Form>
      <DeleteProductModal
        open={deleteModal}
        product={
          productId
            ? { id: productId, name: form.getFieldValue("nama_barang") ?? "" }
            : null
        }
        onClose={() => setDeleteModal(false)}
        onDeleted={() => router.push("/barang")}
      />
    </Card>
  );
};

export default ProductForm;

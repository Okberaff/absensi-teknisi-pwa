import { useEffect, useState } from "react";
import "./index.css";

type Teknisi = {
  id: number;
  nik: string;
  nama: string;
  serviceArea: string;
  telegramChatId: string;
};

type Absensi = {
  tanggal: string;
  jam: string;
  teknisi: string;
  nik: string;
  serviceArea: string;
  status: string;
  lokasi: string;
  catatan: string;
  fotoSelfie: string;
  gpsLat: string;
  gpsLng: string;
  mapUrl: string;
};

type FotoItem = {
  name: string;
  dataUrl: string;
};

type Order = {
  tanggal: string;
  jamOrder: string;

  noWo: string;
  odp: string;

  teknisi1: string;
  nikTeknisi1: string;
  serviceAreaTeknisi1: string;
  telegramChatIdTeknisi1: string;

  teknisi2: string;
  nikTeknisi2: string;
  serviceAreaTeknisi2: string;
  telegramChatIdTeknisi2: string;

  jenisPekerjaan: string;
  status: string;
  catatan: string;

  jamTerima?: string;
  jamBerangkat?: string;
  jamCheckin?: string;
  jamProses?: string;
  jamSelesai?: string;

  checkinLat?: string;
  checkinLng?: string;
  checkinMapUrl?: string;

  fotoLapangan: FotoItem[];
  fotoHasil: FotoItem[];
  fotoPending: FotoItem[];
  fotoKendala: FotoItem[];
  keteranganPending?: string;
  keteranganKendala?: string;
};

const GOOGLE_SCRIPT_URL: string = String(
  "https://script.google.com/macros/s/AKfycbxYIPOPCejUNTaAF1k7URM-NJsGlC9037YeK-1EzbfsEcqlEZG-4c8966QWDWYXDfE7VQ/exec"
);

const API_TOKEN: string = "";

// Login user diambil dari Google Sheet USERS melalui Apps Script.
type LoginUser = {
  role: "superadmin" | "admin" | "teknisi";
  nik: string;
  nama: string;
};

type Role = "" | "admin" | "teknisi";
type TabAdmin = "dashboard" | "order" | "teknisi" | "rekap" | "riwayatBulanan";
type TabTeknisi = "absen" | "order" | "riwayat";

const teknisiAwal: Teknisi[] = [
  { id: 1, nik: "16070476", nama: "HAFIZ MAULANA", serviceArea: "" , telegramChatId: "" },
  { id: 2, nik: "16984756", nama: "VERRY ANDISTA", serviceArea: "" , telegramChatId: "" },
  { id: 3, nik: "16995598", nama: "ABDUL MAJID", serviceArea: "" , telegramChatId: "" },
  { id: 4, nik: "16995697", nama: "M RAMLI TEDDY SISWOYO", serviceArea: "Sukaramai" , telegramChatId: "" },
  { id: 5, nik: "16014242", nama: "MHD FAUZAN ARZAD", serviceArea: "Sukaramai" , telegramChatId: "" },
  { id: 6, nik: "16942756", nama: "M MUKLAS", serviceArea: "Lubuk Pakam" , telegramChatId: "" },
  { id: 7, nik: "16070276", nama: "NAUFAL NAWARUDDIN", serviceArea: "Lubuk Pakam" , telegramChatId: "" },
  { id: 8, nik: "25960231", nama: "CHICCO PARYOGO", serviceArea: "Binjai" , telegramChatId: "" },
  { id: 9, nik: "25930189", nama: "BATARA SIMSON SIMANJUNTAK", serviceArea: "Binjai" , telegramChatId: "" },
  { id: 10, nik: "16953263", nama: "YUDHA RAKA SIWI", serviceArea: "Langsa" , telegramChatId: "" },
  { id: 11, nik: "16820176", nama: "IRWANTO", serviceArea: "Langsa" , telegramChatId: "" },
  { id: 12, nik: "16011092", nama: "Muhammad ikram", serviceArea: "" , telegramChatId: "" },
  { id: 13, nik: "16023094", nama: "KHEMAL PASHA ADITIA", serviceArea: "" , telegramChatId: "" },
  { id: 14, nik: "NO NIK", nama: "MUHAMMAD RISKI AMANDA", serviceArea: "" , telegramChatId: "" },
  { id: 15, nik: "NO NIK", nama: "FAJAR ADNAN", serviceArea: "" , telegramChatId: "" },
  { id: 16, nik: "NO NIK", nama: "IMMANUEL", serviceArea: "" , telegramChatId: "" },
  { id: 17, nik: "NO NIK", nama: "DAFFA", serviceArea: "" , telegramChatId: "" },
  { id: 18, nik: "16932577", nama: "DAVIT MANUMPAK KRISTIAN SINAGA", serviceArea: "" , telegramChatId: "" },
  { id: 19, nik: "16964292", nama: "ERIK TAKDISUSILO MANALU", serviceArea: "" , telegramChatId: "" },
];

function hariIni() {
  return new Date().toISOString().slice(0, 10);
}

function jamSekarang() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sudahLewatJam8() {
  const sekarang = new Date();
  const batas = new Date();
  batas.setHours(8, 0, 0, 0);
  return sekarang > batas;
}

function sudahJam12AtauLebih() {
  const sekarang = new Date();
  const batas = new Date();
  batas.setHours(12, 0, 0, 0);
  return sekarang >= batas;
}

function bulanIni() {
  return new Date().toISOString().slice(0, 7);
}

function cocokBulan(tanggal: string, bulan: string) {
  return tanggal.startsWith(bulan);
}

function csvCell(value: string | undefined) {
  const text = value || "";
  return `"${text.replaceAll('"', '""')}"`;
}

function buatCSV(namaFile: string, header: string, isi: string) {
  const file = new Blob([header + isi], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  a.click();
  URL.revokeObjectURL(url);
}

function bacaBanyakFoto(files: FileList | null): Promise<FotoItem[]> {
  if (!files || files.length === 0) return Promise.resolve([]);

  const list = Array.from(files);

  return Promise.all(
    list.map(
      (file) =>
        new Promise<FotoItem>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              dataUrl: reader.result as string,
            });
          };
          reader.readAsDataURL(file);
        })
    )
  );
}

export default function App() {
  const [role, setRole] = useState<Role>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginNik, setLoginNik] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(null);

  const [tabAdmin, setTabAdmin] = useState<TabAdmin>("dashboard");
  const [tabTeknisi, setTabTeknisi] = useState<TabTeknisi>("absen");
  const [filterBulanAdmin, setFilterBulanAdmin] = useState(bulanIni());
  const [filterBulanTeknisi, setFilterBulanTeknisi] = useState(bulanIni());

  const [teknisi, setTeknisi] = useState<Teknisi[]>(teknisiAwal);
  const [pilihTeknisiId, setPilihTeknisiId] = useState<number>(1);

  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const teknisiTerpilih =
    teknisi.find((t) => t.id === pilihTeknisiId) || teknisi[0];

  const [fotoSelfie, setFotoSelfie] = useState("");
  const [gps, setGps] = useState({
    lat: "",
    lng: "",
    mapUrl: "",
  });

  const [formAbsen, setFormAbsen] = useState({
    status: "Hadir",
    lokasi: "",
    catatan: "Siap menerima tugas",
  });

  const [formOrder, setFormOrder] = useState({
    noWo: "",
    odp: "",
    teknisi1Id: 1,
    teknisi2Id: 0,
    jenisPekerjaan: "",
    catatan: "",
  });

  useEffect(() => {
    loadTeknisiDariGoogleSheet();
  }, []);

  function loadTeknisiDariGoogleSheet() {
    if (!GOOGLE_SCRIPT_URL) {
      alert("URL Google Apps Script belum diisi di App.tsx.");
      return;
    }

    const callbackName = "callbackTeknisi" + Date.now();

    (window as any)[callbackName] = (result: any) => {
      try {
        if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
          setTeknisi(result.data);

          const masihAda = result.data.find((t: Teknisi) => t.id === pilihTeknisiId);
          if (!masihAda) {
            setPilihTeknisiId(result.data[0].id);
          }

          alert(`Data teknisi berhasil direfresh. Total: ${result.data.length} teknisi.`);
        } else {
          alert(result.message || "Data teknisi tidak ditemukan di sheet NAKER.");
        }
      } finally {
        delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script) {
          script.remove();
        }
      }
    };

    const script = document.createElement("script");
    script.id = callbackName;
    script.src = `${GOOGLE_SCRIPT_URL}?action=teknisi&callback=${callbackName}`;
    script.onerror = () => {
      alert("Gagal mengambil data teknisi. Pastikan Web App sudah deploy versi terbaru dan akses Anyone.");
      delete (window as any)[callbackName];
      script.remove();
    };

    document.body.appendChild(script);
  }

  function ambilFotoSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoSelfie(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function ambilGPS() {
    if (!navigator.geolocation) {
      alert("GPS tidak didukung di browser ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = String(position.coords.latitude);
        const lng = String(position.coords.longitude);
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        setGps({ lat, lng, mapUrl });
        alert("GPS berhasil diambil.");
      },
      () => {
        alert("Gagal mengambil GPS. Pastikan izin lokasi diaktifkan.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function kirimAbsen() {
    const sudahAbsen = absensi.find(
      (a) => a.tanggal === hariIni() && a.nik === teknisiTerpilih.nik
    );

    if (sudahAbsen) {
      alert("Teknisi ini sudah absen hari ini.");
      return;
    }

    if (!fotoSelfie) {
      alert("Foto selfie wajib diupload.");
      return;
    }

    if (!gps.lat || !gps.lng) {
      alert("GPS wajib diambil terlebih dahulu.");
      return;
    }

    const statusFinal: string =
      ["Hadir", "Standby"].includes(formAbsen.status) && sudahLewatJam8()
        ? "Terlambat"
        : formAbsen.status;

    const data: Absensi = {
      tanggal: hariIni(),
      jam: jamSekarang(),
      teknisi: teknisiTerpilih.nama,
      nik: teknisiTerpilih.nik,
      serviceArea: teknisiTerpilih.serviceArea,
      status: statusFinal,
      lokasi: formAbsen.lokasi,
      catatan: formAbsen.catatan,
      fotoSelfie,
      gpsLat: gps.lat,
      gpsLng: gps.lng,
      mapUrl: gps.mapUrl,
    };

    setAbsensi([data, ...absensi]);
    setFormAbsen({
      status: "Hadir",
      lokasi: "",
      catatan: "Siap menerima tugas",
    });
    setFotoSelfie("");
    setGps({ lat: "", lng: "", mapUrl: "" });

    alert("Absensi berhasil dikirim.");
  }

  async function buatOrder() {
    if (!formOrder.noWo || !formOrder.odp || !formOrder.jenisPekerjaan) {
      alert("No. WO, ODP, dan Jenis Pekerjaan wajib diisi.");
      return;
    }

    const noWoSudahAda = orders.find((o) => o.noWo === formOrder.noWo);
    if (noWoSudahAda) {
      alert("No. WO ini sudah pernah dibuat.");
      return;
    }

    const t1 = teknisi.find((x) => x.id === Number(formOrder.teknisi1Id));
    const t2 = teknisi.find((x) => x.id === Number(formOrder.teknisi2Id));

    if (!t1) {
      alert("Teknisi 1 wajib dipilih.");
      return;
    }

    const data: Order = {
      tanggal: hariIni(),
      jamOrder: jamSekarang(),

      noWo: formOrder.noWo,
      odp: formOrder.odp,

      teknisi1: t1.nama,
      nikTeknisi1: t1.nik,
      serviceAreaTeknisi1: t1.serviceArea,
      telegramChatIdTeknisi1: t1.telegramChatId,

      teknisi2: t2 ? t2.nama : "",
      nikTeknisi2: t2 ? t2.nik : "",
      serviceAreaTeknisi2: t2 ? t2.serviceArea : "",
      telegramChatIdTeknisi2: t2 ? t2.telegramChatId : "",

      jenisPekerjaan: formOrder.jenisPekerjaan,
      status: "Baru",
      catatan: formOrder.catatan,

      fotoLapangan: [],
      fotoHasil: [],
      fotoPending: [],
      fotoKendala: [],
      keteranganPending: "",
      keteranganKendala: "",
    };

    setOrders([data, ...orders]);

    setFormOrder({
      noWo: "",
      odp: "",
      teknisi1Id: 1,
      teknisi2Id: 0,
      jenisPekerjaan: "",
      catatan: "",
    });

    await kirimNotifOrderTelegram(data);

    alert("Order berhasil dibuat.");
  }

  async function kirimNotifOrderTelegram(order: Order) {
    if (!GOOGLE_SCRIPT_URL) {
      return;
    }

    if (!order.telegramChatIdTeknisi1 && !order.telegramChatIdTeknisi2) {
      return;
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          token: API_TOKEN,
          type: "notify_order",
          data: order,
        }),
      });
    } catch (error) {
      console.log("Gagal kirim notif Telegram", error);
    }
  }

  async function kirimNotifStatusTelegram(order: Order, status: string) {
    if (!GOOGLE_SCRIPT_URL) {
      return;
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          token: API_TOKEN,
          type: "notify_status",
          data: {
            order,
            status,
          },
        }),
      });
    } catch (error) {
      console.log("Gagal kirim notif status Telegram", error);
    }
  }

  function adminSetAbsensi(teknisiData: Teknisi, status: "Tanpa Keterangan" | "Libur") {
    const sudahAda = absensi.find(
      (a) => a.tanggal === hariIni() && a.nik === teknisiData.nik
    );

    if (sudahAda) {
      alert("Teknisi ini sudah punya status absensi hari ini.");
      return;
    }

    const data: Absensi = {
      tanggal: hariIni(),
      jam: jamSekarang(),
      teknisi: teknisiData.nama,
      nik: teknisiData.nik,
      serviceArea: teknisiData.serviceArea,
      status,
      lokasi: "",
      catatan:
        status === "Tanpa Keterangan"
          ? "Diinput admin: teknisi belum absen sampai jam 12:00"
          : "Diinput admin: teknisi libur",
      fotoSelfie: "",
      gpsLat: "",
      gpsLng: "",
      mapUrl: "",
    };

    setAbsensi([data, ...absensi]);
  }

  function updateStatus(noWo: string, status: string) {
    let updatedOrderForNotif: Order | null = null;

    setOrders(
      orders.map((order) => {
        if (order.noWo !== noWo) return order;

        const tambahan: Partial<Order> = {};

        if (status === "Diterima") tambahan.jamTerima = jamSekarang();
        if (status === "Berangkat") tambahan.jamBerangkat = jamSekarang();
        if (status === "Proses") tambahan.jamProses = jamSekarang();
        if (status === "Selesai") tambahan.jamSelesai = jamSekarang();

        const updatedOrder = { ...order, status, ...tambahan };
        updatedOrderForNotif = updatedOrder;

        return updatedOrder;
      })
    );

    if (updatedOrderForNotif && ["Berangkat", "Proses", "Selesai"].includes(status)) {
      kirimNotifStatusTelegram(updatedOrderForNotif, status);
    }
  }

  function checkinOrder(noWo: string) {
    if (!navigator.geolocation) {
      alert("GPS tidak didukung di browser ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = String(position.coords.latitude);
        const lng = String(position.coords.longitude);
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        setOrders(
          orders.map((order) =>
            order.noWo === noWo
              ? {
                  ...order,
                  status: "Check-in",
                  jamCheckin: jamSekarang(),
                  checkinLat: lat,
                  checkinLng: lng,
                  checkinMapUrl: mapUrl,
                }
              : order
          )
        );

        alert("Check-in berhasil. Titik koordinat sudah tersimpan.");
      },
      () => {
        alert("Gagal mengambil GPS. Pastikan izin lokasi diaktifkan.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function tambahFotoLapangan(noWo: string, files: FileList | null) {
    const fotoBaru = await bacaBanyakFoto(files);

    if (fotoBaru.length === 0) return;

    setOrders(
      orders.map((order) =>
        order.noWo === noWo
          ? {
              ...order,
              fotoLapangan: [...order.fotoLapangan, ...fotoBaru],
            }
          : order
      )
    );

    alert(`${fotoBaru.length} foto lapangan berhasil ditambahkan.`);
  }

  async function tambahFotoHasil(noWo: string, files: FileList | null) {
    const fotoBaru = await bacaBanyakFoto(files);

    if (fotoBaru.length === 0) return;

    setOrders(
      orders.map((order) =>
        order.noWo === noWo
          ? {
              ...order,
              fotoHasil: [...order.fotoHasil, ...fotoBaru],
            }
          : order
      )
    );

    alert(`${fotoBaru.length} foto hasil berhasil ditambahkan.`);
  }

  function updateKeteranganPending(noWo: string, value: string) {
    setOrders(
      orders.map((order) =>
        order.noWo === noWo
          ? {
              ...order,
              keteranganPending: value,
            }
          : order
      )
    );
  }

  async function tambahFotoPending(noWo: string, files: FileList | null) {
    const fotoBaru = await bacaBanyakFoto(files);

    if (fotoBaru.length === 0) return;

    setOrders(
      orders.map((order) =>
        order.noWo === noWo
          ? {
              ...order,
              fotoPending: [...order.fotoPending, ...fotoBaru],
            }
          : order
      )
    );

    alert(`${fotoBaru.length} foto pending berhasil ditambahkan.`);
  }

  function setOrderPending(noWo: string) {
    const order = orders.find((o) => o.noWo === noWo);

    if (!order) {
      return;
    }

    if (!order.keteranganPending || !order.keteranganPending.trim()) {
      alert("Keterangan pending wajib diisi.");
      return;
    }

    if (!order.fotoPending || order.fotoPending.length === 0) {
      alert("Foto pending wajib diupload minimal 1 foto.");
      return;
    }

    updateStatus(noWo, "Pending");
  }

  function updateKeteranganKendala(noWo: string, value: string) {
    setOrders(
      orders.map((order) =>
        order.noWo === noWo
          ? {
              ...order,
              keteranganKendala: value,
            }
          : order
      )
    );
  }

  async function tambahFotoKendala(noWo: string, files: FileList | null) {
    const fotoBaru = await bacaBanyakFoto(files);

    if (fotoBaru.length === 0) return;

    setOrders(
      orders.map((order) =>
        order.noWo === noWo
          ? {
              ...order,
              fotoKendala: [...order.fotoKendala, ...fotoBaru],
            }
          : order
      )
    );

    alert(`${fotoBaru.length} foto kendala berhasil ditambahkan.`);
  }

  function setOrderKendala(noWo: string) {
    const order = orders.find((o) => o.noWo === noWo);

    if (!order) {
      return;
    }

    if (!order.keteranganKendala || !order.keteranganKendala.trim()) {
      alert("Keterangan kendala wajib diisi.");
      return;
    }

    if (!order.fotoKendala || order.fotoKendala.length === 0) {
      alert("Foto kendala wajib diupload minimal 1 foto.");
      return;
    }

    updateStatus(noWo, "Kendala");
  }

  function setOrderSelesai(noWo: string) {
    const order = orders.find((o) => o.noWo === noWo);

    if (!order) {
      return;
    }

    if (!order.fotoHasil || order.fotoHasil.length === 0) {
      alert("Foto hasil pekerjaan wajib diupload minimal 1 foto sebelum order diselesaikan.");
      return;
    }

    updateStatus(noWo, "Selesai");
  }

  function exportAbsensi() {
    const header =
      "Tanggal,Jam,NIK,Teknisi,Service Area,Status,Lokasi Manual,Latitude,Longitude,Google Maps,Foto Selfie,Catatan\n";

    const isi = absensi
      .map((a) =>
        [
          a.tanggal,
          a.jam,
          a.nik,
          a.teknisi,
          a.serviceArea,
          a.status,
          a.lokasi,
          a.gpsLat,
          a.gpsLng,
          a.mapUrl,
          a.fotoSelfie ? "Ada" : "Tidak Ada",
          a.catatan,
        ]
          .map(csvCell)
          .join(",")
      )
      .join("\n");

    buatCSV("rekap-absensi.csv", header, isi);
  }

  function exportOrder() {
    const header =
      "Tanggal,Jam Order,No WO,ODP,Teknisi 1,NIK Teknisi 1,Service Area Teknisi 1,Teknisi 2,NIK Teknisi 2,Service Area Teknisi 2,Jenis Pekerjaan,Status,Jam Terima,Jam Berangkat,Jam Checkin,Checkin Latitude,Checkin Longitude,Checkin Google Maps,Jam Proses,Jam Selesai,Keterangan Pending,Jumlah Foto Pending,Keterangan Kendala,Jumlah Foto Kendala,Jumlah Foto Lapangan,Jumlah Foto Hasil,Catatan\n";

    const isi = orders
      .map((o) =>
        [
          o.tanggal,
          o.jamOrder,
          o.noWo,
          o.odp,
          o.teknisi1,
          o.nikTeknisi1,
          o.serviceAreaTeknisi1,
          o.teknisi2,
          o.nikTeknisi2,
          o.serviceAreaTeknisi2,
          o.jenisPekerjaan,
          o.status,
          o.jamTerima || "",
          o.jamBerangkat || "",
          o.jamCheckin || "",
          o.checkinLat || "",
          o.checkinLng || "",
          o.checkinMapUrl || "",
          o.jamProses || "",
          o.jamSelesai || "",
          o.keteranganPending || "",
          String(o.fotoPending.length),
          o.keteranganKendala || "",
          String(o.fotoKendala.length),
          String(o.fotoLapangan.length),
          String(o.fotoHasil.length),
          o.catatan,
        ]
          .map(csvCell)
          .join(",")
      )
      .join("\n");

    buatCSV("rekap-order.csv", header, isi);
  }

  async function uploadKeGoogleSheet(type: "absensi" | "order") {
    if (!GOOGLE_SCRIPT_URL) {
      alert("URL Google Apps Script belum diisi di App.tsx.");
      return;
    }

    const data = type === "absensi" ? absensi : orders;

    if (data.length === 0) {
      alert(type === "absensi" ? "Belum ada data absensi." : "Belum ada data order.");
      return;
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          token: API_TOKEN,
          type,
          data,
        }),
      });

      alert(
        type === "absensi"
          ? "Absensi dikirim ke Google Sheet. Cek sheet REKAP_ABSENSI."
          : "Order dikirim ke Google Sheet. Cek sheet REKAP_ORDER."
      );
    } catch (error) {
      alert("Gagal upload ke Google Sheet: " + String(error));
    }
  }

  const orderSaya = orders.filter(
    (o) =>
      o.nikTeknisi1 === teknisiTerpilih.nik ||
      o.nikTeknisi2 === teknisiTerpilih.nik
  );

  const totalHadirHariIni = absensi.filter(
    (a) => a.tanggal === hariIni() && ["Hadir", "Standby"].includes(a.status)
  ).length;

  const totalTelatHariIni = absensi.filter(
    (a) => a.tanggal === hariIni() && a.status === "Terlambat"
  ).length;

  const totalOrderAktif = orders.filter(
    (o) => !["Selesai", "Approved", "Ditolak"].includes(o.status)
  ).length;

  const totalOrderSelesai = orders.filter((o) =>
    ["Selesai", "Approved"].includes(o.status)
  ).length;

  const ordersBulanAdmin = orders.filter((o) => cocokBulan(o.tanggal, filterBulanAdmin));
  const absensiBulanAdmin = absensi.filter((a) => cocokBulan(a.tanggal, filterBulanAdmin));

  const ordersBulanTeknisi = orderSaya.filter((o) =>
    cocokBulan(o.tanggal, filterBulanTeknisi)
  );

  const absensiBulanTeknisi = absensi.filter(
    (a) => a.nik === teknisiTerpilih.nik && cocokBulan(a.tanggal, filterBulanTeknisi)
  );

  const rekapTeknisiBulanan = teknisi.map((t) => {
    const orderTeknisi = ordersBulanAdmin.filter(
      (o) => o.nikTeknisi1 === t.nik || o.nikTeknisi2 === t.nik
    );

    const absensiTeknisi = absensiBulanAdmin.filter((a) => a.nik === t.nik);

    return {
      teknisi: t,
      totalOrder: orderTeknisi.length,
      selesai: orderTeknisi.filter((o) => ["Selesai", "Approved"].includes(o.status)).length,
      pending: orderTeknisi.filter((o) => o.status === "Pending").length,
      aktif: orderTeknisi.filter(
        (o) => !["Selesai", "Approved", "Ditolak", "Pending", "Kendala"].includes(o.status)
      ).length,
      hadir: absensiTeknisi.filter((a) => ["Hadir", "Standby"].includes(a.status)).length,
      telat: absensiTeknisi.filter((a) => a.status === "Terlambat").length,
      tanpaKeterangan: absensiTeknisi.filter((a) => a.status === "Tanpa Keterangan").length,
      libur: absensiTeknisi.filter((a) => a.status === "Libur").length,
    };
  });

  function exportRiwayatBulananAdmin() {
    const header =
      "Bulan,NIK,Teknisi,Service Area,Total Order,Selesai,Pending,Aktif,Hadir/Standby,Terlambat,Tanpa Keterangan,Libur\n";

    const isi = rekapTeknisiBulanan
      .map((r) =>
        [
          filterBulanAdmin,
          r.teknisi.nik,
          r.teknisi.nama,
          r.teknisi.serviceArea,
          String(r.totalOrder),
          String(r.selesai),
          String(r.pending),
          String(r.aktif),
          String(r.hadir),
          String(r.telat),
          String(r.tanpaKeterangan),
          String(r.libur),
        ]
          .map(csvCell)
          .join(",")
      )
      .join("\n");

    buatCSV(`riwayat-bulanan-${filterBulanAdmin}.csv`, header, isi);
  }

  async function uploadRiwayatBulananAdmin() {
    if (!GOOGLE_SCRIPT_URL) {
      alert("URL Google Apps Script belum diisi di App.tsx.");
      return;
    }

    const data = rekapTeknisiBulanan.map((r) => ({
      bulan: filterBulanAdmin,
      nik: r.teknisi.nik,
      teknisi: r.teknisi.nama,
      serviceArea: r.teknisi.serviceArea,
      totalOrder: r.totalOrder,
      selesai: r.selesai,
      pending: r.pending,
      aktif: r.aktif,
      hadir: r.hadir,
      telat: r.telat,
      tanpaKeterangan: r.tanpaKeterangan,
      libur: r.libur,
    }));

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          token: API_TOKEN,
          type: "riwayat_bulanan",
          data,
        }),
      });

      alert("Riwayat bulanan dikirim ke Google Sheet. Cek sheet RIWAYAT_BULANAN.");
    } catch (error) {
      alert("Gagal upload riwayat bulanan: " + String(error));
    }
  }

  function loginUser() {
    if (!GOOGLE_SCRIPT_URL) {
      setLoginError("URL Google Apps Script belum diisi di App.tsx.");
      return;
    }

    const nik = loginNik.trim();
    const pin = loginPin.trim();

    if (!nik) {
      setLoginError("NIK wajib diisi.");
      return;
    }

    const callbackName = "callbackLogin" + Date.now();

    (window as any)[callbackName] = (result: any) => {
      try {
        if (!result.ok) {
          setLoginError(result.message || "Login gagal.");
          return;
        }

        const user = result.user as LoginUser;

        if (user.role === "teknisi") {
          const t = teknisi.find((x) => String(x.nik).trim() === String(user.nik).trim());

          if (!t) {
            setLoginError(
              "NIK berhasil login, tapi tidak ditemukan di data teknisi. Coba refresh data NAKER."
            );
            return;
          }

          setPilihTeknisiId(t.id);
          setRole("teknisi");
        } else {
          setRole("admin");
        }

        setCurrentUser(user);
        setIsLoggedIn(true);
        setLoginError("");
        setLoginPin("");
      } finally {
        delete (window as any)[callbackName];
        const script = document.getElementById(callbackName);
        if (script) {
          script.remove();
        }
      }
    };

    const script = document.createElement("script");
    script.id = callbackName;
    script.src =
      `${GOOGLE_SCRIPT_URL}?action=login` +
      `&nik=${encodeURIComponent(nik)}` +
      `&pin=${encodeURIComponent(pin)}` +
      `&callback=${callbackName}`;

    script.onerror = () => {
      setLoginError("Gagal login. Pastikan Web App sudah deploy versi terbaru.");
      delete (window as any)[callbackName];
      script.remove();
    };

    document.body.appendChild(script);
  }

  function logout() {
    setRole("");
    setIsLoggedIn(false);
    setLoginNik("");
    setLoginPin("");
    setLoginError("");
    setCurrentUser(null);
    setTabAdmin("dashboard");
    setTabTeknisi("absen");
  }

  function namaUserLogin() {
    if (currentUser?.role === "superadmin") {
      return "Super Admin";
    }

    if (role === "admin") {
      return "Admin";
    }

    return teknisiTerpilih.nama;
  }

  return (
    <div className="container">
      <h1>Absensi & Job Order Teknisi</h1>
      <p className="subtitle">
        MVP absensi pagi, No. WO, ODP, teknisi 1/2, selfie, GPS, foto pekerjaan, dan export rekap.
      </p>

      {!isLoggedIn && (
        <div className="card">
          <h2>Login</h2>
          <p className="subtitle">
            Teknisi login cukup dengan NIK. Admin login dengan NIK dan PIN
          </p>

          <label>NIK</label>
          <input
            value={loginNik}
            onChange={(e) => setLoginNik(e.target.value)}
            placeholder="Masukkan NIK teknisi / NIK admin"
          />

          <label>PIN Admin / Super Admin</label>
          <input
            type="password"
            value={loginPin}
            onChange={(e) => setLoginPin(e.target.value)}
            placeholder="Khusus admin"
          />

          {loginError && <p className="error-text">{loginError}</p>}

          <button onClick={loginUser}>Login</button>
        </div>
      )}

      {isLoggedIn && (
        <div className="card">
          <div className="row-between">
            <div>
              <b>{namaUserLogin()}</b>
              {isLoggedIn && role === "teknisi" && (
                <>
                  <p>NIK: {teknisiTerpilih.nik}</p>
                  <p>Service Area: {teknisiTerpilih.serviceArea || "-"}</p>
                </>
              )}
            </div>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      )}

      {isLoggedIn && role === "admin" && (
        <>
          <div className="tabs">
            <button
              className={tabAdmin === "dashboard" ? "active" : ""}
              onClick={() => setTabAdmin("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={tabAdmin === "order" ? "active" : ""}
              onClick={() => setTabAdmin("order")}
            >
              Buat Order
            </button>
            <button
              className={tabAdmin === "teknisi" ? "active" : ""}
              onClick={() => setTabAdmin("teknisi")}
            >
              Data Teknisi
            </button>
            <button
              className={tabAdmin === "rekap" ? "active" : ""}
              onClick={() => setTabAdmin("rekap")}
            >
              Rekap
            </button>
            <button
              className={tabAdmin === "riwayatBulanan" ? "active" : ""}
              onClick={() => setTabAdmin("riwayatBulanan")}
            >
              Riwayat Bulanan
            </button>
          </div>

          {tabAdmin === "dashboard" && (
            <>
              <div className="grid-4">
                <div className="stat">
                  <b>{totalHadirHariIni}</b>
                  <span>Hadir / Standby</span>
                </div>
                <div className="stat">
                  <b>{totalTelatHariIni}</b>
                  <span>Terlambat</span>
                </div>
                <div className="stat">
                  <b>{totalOrderAktif}</b>
                  <span>Order Aktif</span>
                </div>
                <div className="stat">
                  <b>{totalOrderSelesai}</b>
                  <span>Order Selesai</span>
                </div>
              </div>


              <div className="card">
                <h2>Teknisi Belum Absen Hari Ini</h2>
                {!sudahJam12AtauLebih() && (
                  <p className="info-text">
                    Admin menentukan status Tanpa Keterangan/Libur setelah jam 12:00.
                  </p>
                )}

                {teknisi.filter(
                  (t) => !absensi.find((a) => a.tanggal === hariIni() && a.nik === t.nik)
                ).length === 0 && <p>Semua teknisi sudah punya status absensi hari ini.</p>}

                {teknisi
                  .filter((t) => !absensi.find((a) => a.tanggal === hariIni() && a.nik === t.nik))
                  .map((t) => (
                    <div className="item" key={t.id}>
                      <b>{t.nama}</b>
                      <p>NIK: {t.nik}</p>
                      <p>Service Area: {t.serviceArea || "-"}</p>

                      {sudahJam12AtauLebih() ? (
                        <>
                          <button onClick={() => adminSetAbsensi(t, "Tanpa Keterangan")}>
                            Set Tanpa Keterangan
                          </button>
                          <button onClick={() => adminSetAbsensi(t, "Libur")}>
                            Set Libur
                          </button>
                        </>
                      ) : (
                        <p className="info-text">Menunggu sampai jam 12:00.</p>
                      )}
                    </div>
                  ))}
              </div>

              <div className="card">
                <h2>Monitoring Order</h2>
                {orders.length === 0 && <p>Belum ada order.</p>}

                {orders.map((order) => (
                  <div className="item" key={order.noWo}>
                    <div className="row-between">
                      <b>{order.noWo}</b>
                      <span className={`badge ${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                    <p>ODP: {order.odp}</p>
                    <p>Teknisi 1: {order.teknisi1}</p>
                    <p>Teknisi 2: {order.teknisi2 || "-"}</p>
                    <p>Jenis Pekerjaan: {order.jenisPekerjaan}</p>
                    <p>Check-in: {order.checkinLat ? `${order.checkinLat}, ${order.checkinLng}` : "-"}</p>
                    {order.checkinMapUrl && (
                      <p>
                        <a href={order.checkinMapUrl} target="_blank">
                          Buka Titik Check-in
                        </a>
                      </p>
                    )}
                    <p>Keterangan Pending: {order.keteranganPending || "-"}</p>
                    <p>Foto Pending: {order.fotoPending.length}</p>
                    <p>Keterangan Kendala: {order.keteranganKendala || "-"}</p>
                    <p>Foto Kendala: {order.fotoKendala.length}</p>
                    <p>Foto Lapangan: {order.fotoLapangan.length}</p>
                    <p>Foto Hasil: {order.fotoHasil.length}</p>
                    <p>Catatan: {order.catatan || "-"}</p>

                    {order.status === "Selesai" && (
                      <button onClick={() => updateStatus(order.noWo, "Approved")}>
                        Approve Laporan
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tabAdmin === "order" && (
            <div className="card">
              <h2>Buat Order Teknisi</h2>

              <label>No. WO</label>
              <input
                value={formOrder.noWo}
                onChange={(e) =>
                  setFormOrder({ ...formOrder, noWo: e.target.value })
                }
                placeholder="Contoh: 1234567890"
              />

              <label>ODP</label>
              <input
                value={formOrder.odp}
                onChange={(e) =>
                  setFormOrder({ ...formOrder, odp: e.target.value })
                }
                placeholder="Contoh: ODP-CTD-FAM"
              />

              <label>Teknisi 1</label>
              <select
                value={formOrder.teknisi1Id}
                onChange={(e) =>
                  setFormOrder({
                    ...formOrder,
                    teknisi1Id: Number(e.target.value),
                  })
                }
              >
                {teknisi.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama} - {t.nik} - {t.serviceArea || "-"}
                  </option>
                ))}
              </select>

              <label>Teknisi 2</label>
              <select
                value={formOrder.teknisi2Id}
                onChange={(e) =>
                  setFormOrder({
                    ...formOrder,
                    teknisi2Id: Number(e.target.value),
                  })
                }
              >
                <option value={0}>Tidak ada teknisi 2</option>
                {teknisi.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama} - {t.nik} - {t.serviceArea || "-"}
                  </option>
                ))}
              </select>

              <label>Jenis Pekerjaan</label>
              <input
                value={formOrder.jenisPekerjaan}
                onChange={(e) =>
                  setFormOrder({ ...formOrder, jenisPekerjaan: e.target.value })
                }
                placeholder="Contoh: EXPAND, NEW ODP"
              />

              <label>Catatan</label>
              <textarea
                value={formOrder.catatan}
                onChange={(e) =>
                  setFormOrder({ ...formOrder, catatan: e.target.value })
                }
                placeholder="Catatan tambahan untuk teknisi"
              />

              <button onClick={buatOrder}>Kirim Order</button>
            </div>
          )}

          {tabAdmin === "teknisi" && (
            <div className="card">
              <h2>Data Teknisi</h2>
              {currentUser?.role === "superadmin" && (
                <p className="info-text">
                  User login dikelola di Google Sheet tab USERS. Super Admin bisa ubah NIK admin, PIN admin, dan NIK teknisi yang boleh login di tab tersebut.
                </p>
              )}
              <button onClick={loadTeknisiDariGoogleSheet}>
                Refresh Data Teknisi dari Sheet NAKER
              </button>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>NIK</th>
                      <th>Nama Teknisi</th>
                      <th>Service Area</th>
                      <th>Telegram Chat ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teknisi.map((t) => (
                      <tr key={t.id}>
                        <td>{t.nik}</td>
                        <td>{t.nama}</td>
                        <td>{t.serviceArea || "-"}</td>
                        <td>{t.telegramChatId || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tabAdmin === "rekap" && (
            <>
              <div className="card">
                <h2>Rekap Absensi</h2>
                <button onClick={exportAbsensi}>Export Absensi CSV</button>
                <button onClick={() => uploadKeGoogleSheet("absensi")}>
                  Upload Absensi ke Google Sheet
                </button>

                {absensi.length === 0 && <p>Belum ada absensi.</p>}

                {absensi.map((a, index) => (
                  <div className="item" key={index}>
                    <div className="row-between">
                      <b>{a.teknisi}</b>
                      <span className={`badge ${a.status}`}>{a.status}</span>
                    </div>
                    <p>
                      {a.tanggal} {a.jam}
                    </p>
                    <p>NIK: {a.nik}</p>
                    <p>Service Area: {a.serviceArea || "-"}</p>
                    <p>Lokasi manual: {a.lokasi || "-"}</p>
                    <p>GPS: {a.gpsLat}, {a.gpsLng}</p>
                    <p>Catatan: {a.catatan}</p>

                    {a.mapUrl && (
                      <p>
                        <a href={a.mapUrl} target="_blank">
                          Buka Lokasi di Google Maps
                        </a>
                      </p>
                    )}

                    {a.fotoSelfie && (
                      <div className="foto-preview">
                        <p>Foto Selfie:</p>
                        <img src={a.fotoSelfie} alt="Selfie Teknisi" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="card">
                <h2>Rekap Order</h2>
                <button onClick={exportOrder}>Export Order CSV</button>
                <button onClick={() => uploadKeGoogleSheet("order")}>
                  Upload Order ke Google Sheet
                </button>

                {orders.length === 0 && <p>Belum ada order.</p>}

                {orders.map((order) => (
                  <div className="item" key={order.noWo}>
                    <div className="row-between">
                      <b>{order.noWo}</b>
                      <span className={`badge ${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                    <p>Tanggal: {order.tanggal}</p>
                    <p>Jam Order: {order.jamOrder}</p>
                    <p>ODP: {order.odp}</p>
                    <p>Teknisi 1: {order.teknisi1}</p>
                    <p>NIK Teknisi 1: {order.nikTeknisi1}</p>
                    <p>Service Area Teknisi 1: {order.serviceAreaTeknisi1 || "-"}</p>
                    <p>Teknisi 2: {order.teknisi2 || "-"}</p>
                    <p>NIK Teknisi 2: {order.nikTeknisi2 || "-"}</p>
                    <p>Service Area Teknisi 2: {order.serviceAreaTeknisi2 || "-"}</p>
                    <p>Jenis Pekerjaan: {order.jenisPekerjaan}</p>
                    <p>Status: {order.status}</p>
                    <p>Jam Terima: {order.jamTerima || "-"}</p>
                    <p>Jam Berangkat: {order.jamBerangkat || "-"}</p>
                    <p>Jam Check-in: {order.jamCheckin || "-"}</p>
                    <p>Check-in GPS: {order.checkinLat ? `${order.checkinLat}, ${order.checkinLng}` : "-"}</p>
                    {order.checkinMapUrl && (
                      <p>
                        <a href={order.checkinMapUrl} target="_blank">
                          Buka Titik Check-in
                        </a>
                      </p>
                    )}
                    <p>Jam Proses: {order.jamProses || "-"}</p>
                    <p>Jam Selesai: {order.jamSelesai || "-"}</p>
                    <p>Keterangan Pending: {order.keteranganPending || "-"}</p>
                    <p>Jumlah Foto Pending: {order.fotoPending.length}</p>
                    <p>Keterangan Kendala: {order.keteranganKendala || "-"}</p>
                    <p>Jumlah Foto Kendala: {order.fotoKendala.length}</p>
                    <p>Jumlah Foto Lapangan: {order.fotoLapangan.length}</p>
                    <p>Jumlah Foto Hasil: {order.fotoHasil.length}</p>
                    <p>Catatan: {order.catatan || "-"}</p>

                    {order.status === "Selesai" && (
                      <button onClick={() => updateStatus(order.noWo, "Approved")}>
                        Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tabAdmin === "riwayatBulanan" && (
            <>
              <div className="card">
                <h2>Riwayat Orderan Pekerjaan Teknisi Per Bulan</h2>

                <label>Pilih Bulan</label>
                <input
                  type="month"
                  value={filterBulanAdmin}
                  onChange={(e) => setFilterBulanAdmin(e.target.value)}
                />

                <button onClick={exportRiwayatBulananAdmin}>
                  Export Riwayat Bulanan CSV
                </button>
                <button onClick={uploadRiwayatBulananAdmin}>
                  Upload Riwayat Bulanan ke Google Sheet
                </button>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>NIK</th>
                        <th>Nama Teknisi</th>
                        <th>Service Area</th>
                        <th>Total Order</th>
                        <th>Selesai</th>
                        <th>Pending</th>
                        <th>Aktif</th>
                        <th>Hadir/Standby</th>
                        <th>Terlambat</th>
                        <th>Tanpa Keterangan</th>
                        <th>Libur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekapTeknisiBulanan.map((r) => (
                        <tr key={r.teknisi.id}>
                          <td>{r.teknisi.nik}</td>
                          <td>{r.teknisi.nama}</td>
                          <td>{r.teknisi.serviceArea || "-"}</td>
                          <td>{r.totalOrder}</td>
                          <td>{r.selesai}</td>
                          <td>{r.pending}</td>
                          <td>{r.aktif}</td>
                          <td>{r.hadir}</td>
                          <td>{r.telat}</td>
                          <td>{r.tanpaKeterangan}</td>
                          <td>{r.libur}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h2>Detail Order Bulan {filterBulanAdmin}</h2>

                {ordersBulanAdmin.length === 0 && <p>Belum ada order di bulan ini.</p>}

                {ordersBulanAdmin.map((order) => (
                  <div className="item" key={order.noWo}>
                    <div className="row-between">
                      <b>{order.noWo}</b>
                      <span className={`badge ${order.status}`}>{order.status}</span>
                    </div>
                    <p>Tanggal: {order.tanggal} {order.jamOrder}</p>
                    <p>ODP: {order.odp}</p>
                    <p>Teknisi 1: {order.teknisi1}</p>
                    <p>Teknisi 2: {order.teknisi2 || "-"}</p>
                    <p>Jenis Pekerjaan: {order.jenisPekerjaan}</p>
                    <p>Jam Check-in: {order.jamCheckin || "-"}</p>
                    <p>Jam Selesai: {order.jamSelesai || "-"}</p>
                    <p>Keterangan Pending: {order.keteranganPending || "-"}</p>
                    <p>Foto Pending: {order.fotoPending.length}</p>
                    <p>Keterangan Kendala: {order.keteranganKendala || "-"}</p>
                    <p>Foto Kendala: {order.fotoKendala.length}</p>
                    <p>Foto Lapangan: {order.fotoLapangan.length}</p>
                    <p>Foto Hasil: {order.fotoHasil.length}</p>
                    {order.checkinMapUrl && (
                      <p>
                        <a href={order.checkinMapUrl} target="_blank">
                          Buka Titik Check-in
                        </a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

        </>
      )}

      {isLoggedIn && role === "teknisi" && (
        <>
          <div className="tabs">
            <button
              className={tabTeknisi === "absen" ? "active" : ""}
              onClick={() => setTabTeknisi("absen")}
            >
              Absen Pagi
            </button>
            <button
              className={tabTeknisi === "order" ? "active" : ""}
              onClick={() => setTabTeknisi("order")}
            >
              Order Saya
            </button>
            <button
              className={tabTeknisi === "riwayat" ? "active" : ""}
              onClick={() => setTabTeknisi("riwayat")}
            >
              Riwayat
            </button>
          </div>

          {tabTeknisi === "absen" && (
            <div className="card">
              <h2>Absen Pagi</h2>

              <label>Status</label>
              <select
                value={formAbsen.status}
                onChange={(e) =>
                  setFormAbsen({ ...formAbsen, status: e.target.value })
                }
              >
                <option>Hadir</option>
                <option>Standby</option>
                <option>Terlambat</option>
                <option>Izin</option>
                <option>Sakit</option>
              </select>

              <label>Lokasi Manual</label>
              <input
                placeholder="Contoh: Binjai / Sukaramai / Lubuk Pakam"
                value={formAbsen.lokasi}
                onChange={(e) =>
                  setFormAbsen({ ...formAbsen, lokasi: e.target.value })
                }
              />

              <label>Catatan</label>
              <textarea
                value={formAbsen.catatan}
                onChange={(e) =>
                  setFormAbsen({ ...formAbsen, catatan: e.target.value })
                }
              />

              <label>Foto Selfie</label>
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={ambilFotoSelfie}
              />

              {fotoSelfie && (
                <div className="foto-preview">
                  <p>Preview Selfie:</p>
                  <img src={fotoSelfie} alt="Selfie Teknisi" />
                </div>
              )}

              <label>GPS Lokasi</label>
              <button type="button" onClick={ambilGPS}>
                Ambil GPS Sekarang
              </button>

              {gps.mapUrl && (
                <div className="gps-box">
                  <p>Latitude: {gps.lat}</p>
                  <p>Longitude: {gps.lng}</p>
                  <a href={gps.mapUrl} target="_blank">
                    Buka di Google Maps
                  </a>
                </div>
              )}

              <button onClick={kirimAbsen}>Kirim Absensi</button>
            </div>
          )}

          {tabTeknisi === "order" && (
            <div className="card">
              <h2>Order Saya</h2>

              {orderSaya.length === 0 && <p>Belum ada order.</p>}

              {orderSaya.map((order) => (
                <div className="item" key={order.noWo}>
                  <div className="row-between">
                    <b>{order.noWo}</b>
                    <span className={`badge ${order.status}`}>
                      {order.status}
                    </span>
                  </div>

                  <p>ODP: {order.odp}</p>
                  <p>Teknisi 1: {order.teknisi1}</p>
                  <p>Teknisi 2: {order.teknisi2 || "-"}</p>
                  <p>Jenis Pekerjaan: {order.jenisPekerjaan}</p>
                  <p>Catatan: {order.catatan || "-"}</p>
                  <p>Jam Order: {order.jamOrder}</p>

                  {order.status === "Baru" && (
                    <>
                      <button onClick={() => updateStatus(order.noWo, "Diterima")}>
                        Terima Order
                      </button>
                      <button onClick={() => updateStatus(order.noWo, "Ditolak")}>
                        Tolak
                      </button>
                    </>
                  )}

                  {order.status === "Diterima" && (
                    <button onClick={() => updateStatus(order.noWo, "Berangkat")}>
                      Mulai Berangkat
                    </button>
                  )}

                  {order.status === "Berangkat" && (
                    <button onClick={() => checkinOrder(order.noWo)}>
                      Check-in Lokasi + Ambil Titik Koordinat
                    </button>
                  )}

                  {order.status === "Check-in" && (
                    <>
                      <div className="gps-box">
                        <p>Check-in GPS: {order.checkinLat}, {order.checkinLng}</p>
                        {order.checkinMapUrl && (
                          <a href={order.checkinMapUrl} target="_blank">
                            Buka Titik Check-in
                          </a>
                        )}
                      </div>

                      <label>Upload Foto Lapangan / Proses</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) =>
                          tambahFotoLapangan(order.noWo, e.target.files)
                        }
                      />

                      <p>Foto lapangan tersimpan: {order.fotoLapangan.length}</p>

                      {order.fotoLapangan.length > 0 && (
                        <div className="foto-grid">
                          {order.fotoLapangan.map((foto, index) => (
                            <img
                              key={index}
                              src={foto.dataUrl}
                              alt={`Foto lapangan ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      <button onClick={() => updateStatus(order.noWo, "Proses")}>
                        Mulai Kerja
                      </button>
                    </>
                  )}

                  {order.status === "Proses" && (
                    <>
                      <label>Upload Foto Hasil Pekerjaan</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) =>
                          tambahFotoHasil(order.noWo, e.target.files)
                        }
                      />

                      <p>Foto hasil tersimpan: {order.fotoHasil.length}</p>

                      {order.fotoHasil.length > 0 && (
                        <div className="foto-grid">
                          {order.fotoHasil.map((foto, index) => (
                            <img
                              key={index}
                              src={foto.dataUrl}
                              alt={`Foto hasil ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      <label>Keterangan Pending</label>
                      <textarea
                        value={order.keteranganPending || ""}
                        onChange={(e) =>
                          updateKeteranganPending(order.noWo, e.target.value)
                        }
                        placeholder="Contoh: menunggu material, akses belum dibuka, customer reschedule"
                      />

                      <label>Upload Foto Pending</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) =>
                          tambahFotoPending(order.noWo, e.target.files)
                        }
                      />

                      <p>Foto pending tersimpan: {order.fotoPending.length}</p>

                      {order.fotoPending.length > 0 && (
                        <div className="foto-grid">
                          {order.fotoPending.map((foto, index) => (
                            <img
                              key={index}
                              src={foto.dataUrl}
                              alt={`Foto pending ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      <label>Keterangan Kendala</label>
                      <textarea
                        value={order.keteranganKendala || ""}
                        onChange={(e) =>
                          updateKeteranganKendala(order.noWo, e.target.value)
                        }
                        placeholder="Contoh: kabel putus, ODP tidak bisa dibuka, redaman tinggi, perangkat rusak"
                      />

                      <label>Upload Foto Kendala</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) =>
                          tambahFotoKendala(order.noWo, e.target.files)
                        }
                      />

                      <p>Foto kendala tersimpan: {order.fotoKendala.length}</p>

                      {order.fotoKendala.length > 0 && (
                        <div className="foto-grid">
                          {order.fotoKendala.map((foto, index) => (
                            <img
                              key={index}
                              src={foto.dataUrl}
                              alt={`Foto kendala ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      <button onClick={() => setOrderPending(order.noWo)}>
                        Pending
                      </button>
                      <button onClick={() => setOrderKendala(order.noWo)}>
                        Kendala
                      </button>
                      <button onClick={() => setOrderSelesai(order.noWo)}>
                        Selesaikan Order
                      </button>
                    </>
                  )}

                  {order.status === "Pending" && (
                    <>
                      <label>Keterangan Pending</label>
                      <textarea
                        value={order.keteranganPending || ""}
                        onChange={(e) =>
                          updateKeteranganPending(order.noWo, e.target.value)
                        }
                        placeholder="Update keterangan pending"
                      />

                      <label>Tambah Foto Pending</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) =>
                          tambahFotoPending(order.noWo, e.target.files)
                        }
                      />

                      <p>Foto pending tersimpan: {order.fotoPending.length}</p>

                      {order.fotoPending.length > 0 && (
                        <div className="foto-grid">
                          {order.fotoPending.map((foto, index) => (
                            <img
                              key={index}
                              src={foto.dataUrl}
                              alt={`Foto pending ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      <button onClick={() => updateStatus(order.noWo, "Proses")}>
                        Lanjutkan Kerja
                      </button>
                    </>
                  )}

                  {order.status === "Kendala" && (
                    <>
                      <label>Keterangan Kendala</label>
                      <textarea
                        value={order.keteranganKendala || ""}
                        onChange={(e) =>
                          updateKeteranganKendala(order.noWo, e.target.value)
                        }
                        placeholder="Update keterangan kendala"
                      />

                      <label>Tambah Foto Kendala</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) =>
                          tambahFotoKendala(order.noWo, e.target.files)
                        }
                      />

                      <p>Foto kendala tersimpan: {order.fotoKendala.length}</p>

                      {order.fotoKendala.length > 0 && (
                        <div className="foto-grid">
                          {order.fotoKendala.map((foto, index) => (
                            <img
                              key={index}
                              src={foto.dataUrl}
                              alt={`Foto kendala ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}

                      <button onClick={() => updateStatus(order.noWo, "Proses")}>
                        Lanjutkan Kerja
                      </button>
                      <button onClick={() => setOrderSelesai(order.noWo)}>
                        Selesaikan Order
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {tabTeknisi === "riwayat" && (
            <div className="card">
              <h2>Riwayat Saya Per Bulan</h2>

              <label>Pilih Bulan</label>
              <input
                type="month"
                value={filterBulanTeknisi}
                onChange={(e) => setFilterBulanTeknisi(e.target.value)}
              />

              <div className="grid-4">
                <div className="stat">
                  <b>{ordersBulanTeknisi.length}</b>
                  <span>Total Order</span>
                </div>
                <div className="stat">
                  <b>{ordersBulanTeknisi.filter((o) => ["Selesai", "Approved"].includes(o.status)).length}</b>
                  <span>Selesai</span>
                </div>
                <div className="stat">
                  <b>{absensiBulanTeknisi.filter((a) => ["Hadir", "Standby"].includes(a.status)).length}</b>
                  <span>Hadir/Standby</span>
                </div>
                <div className="stat">
                  <b>{absensiBulanTeknisi.filter((a) => a.status === "Terlambat").length}</b>
                  <span>Terlambat</span>
                </div>
              </div>

              <h3>Absensi</h3>
              {absensiBulanTeknisi.length === 0 && <p>Belum ada riwayat absensi bulan ini.</p>}

              {absensiBulanTeknisi
                .map((a, index) => (
                  <div className="item" key={index}>
                    <b>{a.status}</b>
                    <p>
                      {a.tanggal} {a.jam}
                    </p>
                    <p>Lokasi manual: {a.lokasi}</p>
                    <p>GPS: {a.gpsLat}, {a.gpsLng}</p>
                    <p>Catatan: {a.catatan}</p>
                    {a.mapUrl && (
                      <p>
                        <a href={a.mapUrl} target="_blank">
                          Buka Lokasi di Google Maps
                        </a>
                      </p>
                    )}
                  </div>
                ))}

              <h3>Order</h3>
              {ordersBulanTeknisi.length === 0 && <p>Belum ada riwayat order bulan ini.</p>}
              {ordersBulanTeknisi.map((o) => (
                <div className="item" key={o.noWo}>
                  <b>{o.noWo}</b>
                  <p>ODP: {o.odp}</p>
                  <p>Jenis Pekerjaan: {o.jenisPekerjaan}</p>
                  <p>Status: {o.status}</p>
                  <p>Keterangan Pending: {o.keteranganPending || "-"}</p>
                  <p>Foto Pending: {o.fotoPending.length}</p>
                  <p>Keterangan Kendala: {o.keteranganKendala || "-"}</p>
                  <p>Foto Kendala: {o.fotoKendala.length}</p>
                  <p>Foto Lapangan: {o.fotoLapangan.length}</p>
                  <p>Foto Hasil: {o.fotoHasil.length}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
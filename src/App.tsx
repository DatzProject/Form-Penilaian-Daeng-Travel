import React, { useEffect, useMemo, useState } from "react";

// =====================================================================
// KONFIGURASI — ganti URL ini dengan URL Web App hasil deploy Apps Script
// (lihat backend/Code.gs). Contoh:
// https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxx/exec
// =====================================================================
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwLUT-wunXFgQ76SrYNmMaEKoT2zWS2w6iKSa25SBkoIgM-n63mzNmz06vDKPHPi5lPBA/exec";

// Daftar kriteria penilaian — silakan ubah sesuai kebutuhan tour/travel Anda
const KRITERIA: {
  key: keyof SkorKriteria;
  label: string;
  deskripsi: string;
}[] = [
  {
    key: "kedisiplinan",
    label: "Kedisiplinan",
    deskripsi: "Ketepatan waktu, kepatuhan jadwal keberangkatan/kegiatan",
  },
  {
    key: "kerjasama",
    label: "Kerjasama",
    deskripsi: "Kerjasama dengan sesama peserta & panitia/tour leader",
  },
  {
    key: "makanan",
    label: "Makanan",
    deskripsi:
      "Kepuasan terhadap kualitas & penyajian makanan selama perjalanan",
  },
  {
    key: "hotel",
    label: "Hotel",
    deskripsi: "Kepuasan terhadap kenyamanan & pelayanan hotel/penginapan",
  },
  {
    key: "transportasi",
    label: "Transportasi",
    deskripsi: "Kenyamanan & ketepatan armada transportasi selama perjalanan",
  },
  {
    key: "kegiatanPurnabakti",
    label: "Kepuasan Pelaksanaan Kegiatan Purnabakti",
    deskripsi:
      "Kepuasan terhadap keseluruhan pelaksanaan kegiatan purnabakti di luar negeri",
  },
];

interface SkorKriteria {
  kedisiplinan: number;
  kerjasama: number;
  makanan: number;
  hotel: number;
  transportasi: number;
  kegiatanPurnabakti: number;
}

interface FormState {
  namaPeserta: string;
  skor: SkorKriteria;
  catatan: string;
}

const initialSkor: SkorKriteria = {
  kedisiplinan: 0,
  kerjasama: 0,
  makanan: 0,
  hotel: 0,
  transportasi: 0,
  kegiatanPurnabakti: 0,
};

const initialForm: FormState = {
  namaPeserta: "",
  skor: initialSkor,
  catatan: "",
};

type Status = "idle" | "loading" | "success" | "error";

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const rataRata = useMemo(() => {
    const nilai: number[] = KRITERIA.map((k) => form.skor[k.key]);
    const terisi = nilai.filter((n: number) => n > 0);
    if (terisi.length === 0) return 0;
    const total = terisi.reduce((a: number, b: number) => a + b, 0);
    return Math.round((total / terisi.length) * 100) / 100;
  }, [form.skor]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSkor(key: keyof SkorKriteria, value: number) {
    setForm((prev) => ({ ...prev, skor: { ...prev.skor, [key]: value } }));
  }

  function validate(): string | null {
    if (!form.namaPeserta.trim()) return "Nama peserta wajib diisi";
    const belumDinilai = KRITERIA.find((k) => form.skor[k.key] === 0);
    if (belumDinilai)
      return `Kriteria "${belumDinilai.label}" belum diberi nilai`;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setErrorMsg(err);
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const payload = {
      namaPeserta: form.namaPeserta,
      kedisiplinan: form.skor.kedisiplinan,
      kerjasama: form.skor.kerjasama,
      makanan: form.skor.makanan,
      hotel: form.skor.hotel,
      transportasi: form.skor.transportasi,
      kegiatanPurnabakti: form.skor.kegiatanPurnabakti,
      rataRata,
      catatan: form.catatan,
    };

    try {
      // Google Apps Script Web App tidak mendukung header custom pada
      // permintaan sederhana, sehingga kita kirim sebagai text/plain
      // lalu di-parse sebagai JSON di sisi Apps Script (lihat Code.gs).
      const res = await fetch(WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Gagal menyimpan data");
      }

      setStatus("success");
      setForm(initialForm);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Terjadi kesalahan saat mengirim data");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoHeader}>
          <img
            src="/daeng-travel-logo.png"
            alt="Daeng Travel"
            style={styles.logoLeft}
          />
          <div style={styles.logoDivider} />
          <img
            src="/semen-tonasa-logo.png"
            alt="Semen Tonasa"
            style={styles.logoRight}
          />
        </div>

        <div style={styles.eventBadge}>
          Kegiatan Pra Purnabakti PT. Semen Tonasa 2026 — Malaysia
        </div>

        <h1 style={styles.title}>Form Penilaian Peserta Tour Daeng Travel</h1>
        <p style={styles.subtitle}>
          Isi form berikut untuk menilai pelayanan selama kegiatan perjalanan.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Nama Peserta *</label>
            <input
              style={styles.input}
              value={form.namaPeserta}
              onChange={(e) => updateField("namaPeserta", e.target.value)}
              placeholder="Nama lengkap peserta"
            />
          </div>

          <h3 style={styles.sectionTitle}>Kriteria Penilaian (skala 1–5)</h3>
          {KRITERIA.map((k) => (
            <div key={k.key} style={styles.kriteriaRow}>
              <div>
                <div style={styles.kriteriaLabel}>{k.label} *</div>
                <div style={styles.kriteriaDesc}>{k.deskripsi}</div>
              </div>
              <div style={styles.scoreGroup}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => updateSkor(k.key, n)}
                    style={{
                      ...styles.scoreBtn,
                      ...(form.skor[k.key] === n ? styles.scoreBtnActive : {}),
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div style={styles.avgBox}>
            Rata-rata sementara: <strong>{rataRata || "-"}</strong>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Catatan Tambahan</label>
            <textarea
              style={styles.textarea}
              rows={4}
              value={form.catatan}
              onChange={(e) => updateField("catatan", e.target.value)}
              placeholder="Catatan khusus mengenai pelayanan selama perjalanan (opsional)"
            />
          </div>

          {status === "error" && (
            <div style={styles.alertError}>{errorMsg}</div>
          )}
          {status === "success" && (
            <div style={styles.alertSuccess}>Penilaian berhasil dikirim</div>
          )}

          <button
            type="submit"
            style={styles.submitBtn}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Menyimpan..." : "Kirim Penilaian"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "32px 16px",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  card: {
    maxWidth: 640,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 12,
    padding: 28,
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#1f2937" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 24 },
  logoHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: "1px solid #f0f0f0",
  },
  logoLeft: { height: 56, objectFit: "contain" },
  logoRight: { height: 80, objectFit: "contain" },
  logoDivider: { width: 1, height: 40, background: "#e5e7eb" },
  eventBadge: {
    display: "block",
    width: "fit-content",
    margin: "0 auto 16px",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.3,
    color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 999,
    padding: "6px 14px",
  },
  row2: { display: "flex", gap: 16, marginBottom: 4 },
  field: { flex: 1, marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box",
    resize: "vertical",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    margin: "20px 0 12px",
    color: "#1f2937",
  },
  kriteriaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
    gap: 12,
  },
  kriteriaLabel: { fontSize: 14, fontWeight: 600, color: "#111827" },
  kriteriaDesc: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  scoreGroup: { display: "flex", gap: 6 },
  scoreBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },
  scoreBtnActive: {
    background: "#2563eb",
    borderColor: "#2563eb",
    color: "#fff",
  },
  avgBox: {
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    margin: "8px 0 20px",
  },
  alertError: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 14,
  },
  alertSuccess: {
    background: "#f0fdf4",
    color: "#15803d",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 14,
  },
  submitBtn: {
    width: "100%",
    padding: "12px 0",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
};

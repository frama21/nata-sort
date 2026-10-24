import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

const SECTIONS = [
  {
    title: "Privasi",
    body: "Semua file diproses di browser Anda. Tidak ada yang diunggah, dan aplikasi tidak mengirim data ke server mana pun."
  },
  {
    title: "Persyaratan browser",
    body: "Gunakan Chrome, Edge, atau Opera versi terbaru. Aplikasi memerlukan File System Access API, yang belum tersedia di Firefox dan Safari."
  },
  {
    title: "Penyimpanan progres",
    body: "Folder sortir, pemetaan foto, mode salin/pindah, dan log operasi disimpan di file photo-sorter-db.json di dalam folder yang Anda buka. Hapus file itu untuk memulai dari awal."
  },
  {
    title: "Keamanan file",
    body: "Mode default adalah Salin, jadi file asli tidak tersentuh. File tidak pernah ditimpa: nama yang sudah ada mendapat akhiran _1, _2, dan seterusnya. Sortir terakhir bisa dibatalkan dengan Ctrl/Cmd+Z."
  },
  {
    title: "Pintasan keyboard",
    body: "Buka folder, lalu tekan tombol ? di ruang kerja untuk melihat semua pintasan."
  }
]

/** Static help: privacy, requirements, and how progress is stored. */
export const HelpPage = () => (
  <section aria-labelledby="help-title" className="mx-auto max-w-2xl space-y-4">
    <h2 id="help-title" className="text-2xl font-bold">
      Bantuan
    </h2>
    {SECTIONS.map(s => (
      <Card key={s.title}>
        <CardHeader>
          <CardTitle>
            <h3>{s.title}</h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{s.body}</CardContent>
      </Card>
    ))}
  </section>
)

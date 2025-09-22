"use client";

import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function DownloadImagesButton({ storeId }: { storeId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${storeId}/download-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        const downloaded = data.countDownloaded || 0;
        const deleted = data.countDeleted || 0;
        toast.success(
          `Фото: ${downloaded} загружено, ${deleted} удалено`
        );
      } else {
        toast.error(data.error || "⚠️ Ошибка при загрузке изображений");
      }
    } catch (err) {
      console.error(err);
      toast.error("🚨 Ошибка сети. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 cursor-pointer"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </button>
  );
}
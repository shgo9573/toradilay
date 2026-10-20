function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * מדפיס מסמך וורד (שהומר ל-HTML) דרך iframe נסתר, בלי לעזוב את המסך.
 * עם דגל --kiosk-printing בדפדפן ההדפסה יוצאת ישירות למדפסת ברירת המחדל.
 */
export async function printHtmlDocument(title: string, html: string): Promise<void> {
  const printable = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
  html, body { background: #fff; }
  body {
    font-family: 'David', 'Frank Ruhl Libre', 'Times New Roman', 'Assistant', serif;
    font-size: 12pt; line-height: 1.6; color: #000; direction: rtl; margin: 0; padding: 10px;
  }
  h1, h2, h3, h4 { color: #000; text-align: center; }
  p { margin: 0 0 1em; text-align: justify; }
  table { width: 100%; border-collapse: collapse; margin: 1em 0; }
  td, th { border: 1px solid #000; padding: 6px; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>${html}</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "10px",
    height: "10px",
    opacity: "0.01",
    border: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("לא ניתן לפתוח חלון הדפסה");
  }
  doc.open();
  doc.write(printable);
  doc.close();

  await new Promise((r) => setTimeout(r, 400));
  try {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  } catch (err) {
    document.body.removeChild(iframe);
    refocusMainWindow();
    throw err instanceof Error ? err : new Error("ההדפסה נחסמה בדפדפן");
  }

  // מחזירים את הפוקוס לחלון הראשי כדי שהקלדת ת.ז. במקלדת תמשיך לעבוד אחרי ההדפסה
  refocusMainWindow();
  setTimeout(() => {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
    refocusMainWindow();
  }, 60000);
}

/** פוקוס חזרה למסמך הראשי (אחרי iframe של הדפסה) + אות למסך הבית למקד את שדה הת.ז. */
export function refocusMainWindow() {
  try {
    const active = document.activeElement as HTMLElement | null;
    if (active && active.tagName === "IFRAME") active.blur();
    window.focus();
    window.dispatchEvent(new Event("kiosk:refocus"));
  } catch {
    /* ignore */
  }
}

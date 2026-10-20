/**
 * מציג נתיב כונן עם שם תיקייה בעברית בסדר קריאה נכון:
 * הקידומת (D:\) משמאל, ושם התיקייה העברי מימין לה.
 */
export function PathLabel({
  drive,
  folder,
  className = "",
}: {
  drive: string;
  folder: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline ${className}`} dir="ltr">
      <span>{drive}:\</span>
      <span dir="rtl" className="font-sans">
        {folder}
      </span>
    </span>
  );
}

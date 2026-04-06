import Link from "next/link";

export default function StockBadge({ code }: { code: string }) {
  return (
    <Link
      href={`/stock/${code}`}
      className="inline-block bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded-full hover:bg-blue-900/80 transition-colors"
    >
      {code}
    </Link>
  );
}

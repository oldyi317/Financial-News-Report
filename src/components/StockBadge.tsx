import Link from "next/link";

export default function StockBadge({ code }: { code: string }) {
  return (
    <Link
      href={`/stock/${code}`}
      className="cursor-pointer inline-block bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full hover:bg-primary/30 transition-colors"
    >
      {code}
    </Link>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap">
      <h1>Page not found</h1>
      <p className="sub">That page doesn’t exist.</p>
      <Link className="btn" href="/">Back to search</Link>
    </main>
  );
}

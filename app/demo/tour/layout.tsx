// The tour is always dark (stage screen) and must never scroll at the page level.
export default function TourLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="force-dark overflow-hidden" style={{ height: "100dvh" }}>
      {children}
    </div>
  )
}

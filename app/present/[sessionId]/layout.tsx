// The presenter view is a stage/projection screen and always renders dark,
// regardless of the user's theme.
export default function PresentLayout({ children }: { children: React.ReactNode }) {
  return <div className="force-dark">{children}</div>
}

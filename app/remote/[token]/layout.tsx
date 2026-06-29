// The phone remote is part of the live presenting experience and always
// renders dark, regardless of the user's theme.
export default function RemoteLayout({ children }: { children: React.ReactNode }) {
  return <div className="force-dark">{children}</div>
}

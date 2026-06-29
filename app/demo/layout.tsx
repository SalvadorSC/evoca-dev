// The demo showcases the live event experience and always renders dark,
// regardless of the user's theme.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="force-dark">{children}</div>
}

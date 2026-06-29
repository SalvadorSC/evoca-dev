// The attendee live Q&A view is part of the live event experience and always
// renders dark, regardless of the user's theme.
export default function QnaLayout({ children }: { children: React.ReactNode }) {
  return <div className="force-dark">{children}</div>
}

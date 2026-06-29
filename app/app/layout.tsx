// The attendee live experience (joined via QR) is part of the live event and
// always renders dark, regardless of the user's theme.
export default function AttendeeLayout({ children }: { children: React.ReactNode }) {
  return <div className="force-dark">{children}</div>
}

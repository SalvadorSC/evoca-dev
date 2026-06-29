// The speaker live control screen is used while presenting and always renders
// dark, regardless of the user's theme.
export default function SpeakerLayout({ children }: { children: React.ReactNode }) {
  return <div className="force-dark">{children}</div>
}

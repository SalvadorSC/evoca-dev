// The live Wall is a projection screen and always renders dark, regardless
// of the user's theme. `force-dark` re-declares the dark design tokens.
export default function WallLayout({ children }: { children: React.ReactNode }) {
  return <div className="force-dark">{children}</div>
}

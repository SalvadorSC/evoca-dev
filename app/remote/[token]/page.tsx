import { verifyRemoteToken } from "@/lib/remote-token"
import { RemoteControl } from "@/components/remote/remote-control"

export const dynamic = "force-dynamic"

export default async function RemotePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const claims = await verifyRemoteToken(token)

  if (!claims) {
    return (
      <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="font-display font-bold text-white text-2xl uppercase tracking-wide">
          Remote link expired
        </p>
        <p className="font-mono text-xs text-jsconf-muted max-w-xs">
          This remote link is invalid or has expired. Open the presenter view and scan a fresh QR
          code to reconnect.
        </p>
      </div>
    )
  }

  return <RemoteControl room={claims.room} token={token} />
}

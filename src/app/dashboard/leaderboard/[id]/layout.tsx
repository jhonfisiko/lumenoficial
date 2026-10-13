import { connection } from 'next/server'
import { Suspense } from 'react'

async function DynamicMarker() {
  await connection()
  return null
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <DynamicMarker />
      </Suspense>
      {children}
    </>
  )
}
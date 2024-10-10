// app/routes/home/kudo.$userId.tsx
import { getUserById } from '~/utils/user.server'
import { json, LoaderFunction, redirect } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

export const loader: LoaderFunction = async ({ request, params }) => {
  const { userId } = params

  if (typeof userId !== 'string') {
    return redirect('/home')
  }
  const recipient = await getUserById(parseInt(userId))
  return json({ recipient })
}

export default function KudoModal() {
  const { recipient } = useLoaderData()

  if (!recipient) {
    return <h2>User not found</h2>
  }

  return (
    <h2>
      User: {recipient.firstName} {recipient.lastName}
    </h2>
  )
}
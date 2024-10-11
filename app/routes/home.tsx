// app/routes/home.tsx
import { useLoaderData, Outlet } from '@remix-run/react'
import { json,LoaderFunction } from '@remix-run/node'
import { requireUserId } from '~/utils/auth.server'
import { Layout } from '~/components/layout'
import { UserPanel } from '~/components/user-panel'
import { getOtherUsers } from '~/utils/user.server'
import { getFilteredKudos,getRecentKudos } from '~/utils/kudos.server'
import { Kudo } from '~/components/kudo'
import { Kudo as IKudo, User, KudoStyle, Prisma } from '@prisma/client'
import { SearchBar } from '~/components/search-bar'
import { RecentBar } from '~/components/recent-bar'


interface KudoWithProfile extends IKudo {
  author: {
    firstname: string,
    lastname: string,
  }
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const sort = url.searchParams.get('sort') || 'date'
  const filter = url.searchParams.get('filter')

  let sortOptions: Prisma.KudoOrderByWithRelationInput = {}

if (sort === 'date') {
  sortOptions = { createdAt: 'desc' }
} else if (sort === 'sender') {
  sortOptions = {
    author: {
      firstName: 'asc',
    },
  }
} else if (sort === 'emoji') {
  sortOptions = {
    style: {
      emoji: 'asc',
    },
  }
} else {
  // Fallback-Sortierung, falls ein unbekannter Wert für sort übergeben wird
  sortOptions = { createdAt: 'desc' }
}

  // Anpassung des textFilters
  let textFilter: Prisma.KudoWhereInput = {}
  if (filter) {
    textFilter = {
      OR: [
        {
          message: {
            contains: filter,
            // mode: 'insensitive',
          },
        },
        {
          author: {
            OR: [
              {
                firstName: {
                  contains: filter,
                  // mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: filter,
                  // mode: 'insensitive',
                },
              },
            ],
          },
        },
      ],
    }
  }

    
    const userId = await requireUserId(request)
    const users = await getOtherUsers(userId)
    const kudos = await getFilteredKudos(userId, sortOptions, textFilter)
    const recentKudos = await getRecentKudos()
    return json({ users, kudos, recentKudos })
}

export default function Home() {
  const { users, kudos, recentKudos } = useLoaderData()
  return (
    <Layout>
      <Outlet />
      <div className="h-full flex">
        <UserPanel users={users} />
        <div className="flex-1 flex flex-col">
        <SearchBar />
          <div className="flex-1 flex">
            <div className="w-full p-10 flex flex-col gap-y-4">
              {kudos.map((kudo: KudoWithProfile) => (
                <Kudo key={kudo.id} kudo={kudo} user={kudo.author} />
              ))}
            </div>
            <RecentBar kudos={recentKudos} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
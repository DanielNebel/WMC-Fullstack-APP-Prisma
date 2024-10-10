// app/components/user-circle.tsx
import { User } from '@prisma/client'

interface props {
  user: User
  className?: string
  onClick?: (...args: any) => any
}

export function UserCircle({ user, onClick, className }: props) {
  return (
    <div
      className={`${className} cursor-pointer bg-gray-400 rounded-full flex justify-center items-center`}
      onClick={onClick}
    >
      <h2>
        {user.firstName.charAt(0).toUpperCase()}
        {user.lastName.charAt(0).toUpperCase()}
      </h2>
    </div>
  )
}
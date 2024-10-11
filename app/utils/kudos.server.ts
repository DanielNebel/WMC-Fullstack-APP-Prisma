// app/utils/kudos.server.ts

import { prisma } from './prisma.server'
import { KudoStyle, Prisma } from '@prisma/client'

export const getRecentKudos = async () => {
    return await prisma.kudo.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        style: {
          select: {
            emoji: true,
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            // profile: true,
          },
        },
      },
    })
  }

export const getFilteredKudos = async (
    userId: number,
    sortFilter: Prisma.KudoOrderByWithRelationInput,
    whereFilter: Prisma.KudoWhereInput,
  ) => {
    return await prisma.kudo.findMany({
      select: {
        id: true,
        message: true,
        style: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: sortFilter,
      where: {
        recipientId: userId,
        ...whereFilter,
      },
    })
  }

export const createKudo = async (
  message: string,
  userId: number,
  recipientId: number,
  style: {
    backgroundColor: string,
    textColor: string,
    emoji: string,
  }
) => {
  await prisma.kudo.create({
    data: {
      message,
      author: {
        connect: {
          id: userId,
        },
      },
      recipient: {
        connect: {
          id: recipientId,
        },
      },
      style: {
        create: {
          backgroundColor: style.backgroundColor,
          textColor: style.textColor,
          emoji: style.emoji,
        },
      },
    },
  })
}
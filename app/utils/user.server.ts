// app/utils/user.server.ts
import bcrypt from 'bcryptjs'
import type { RegisterForm } from './types.server'
import { prisma } from './prisma.server'
import fs from 'fs';
import path from 'path';
import { createId } from '@paralleldrive/cuid2';

export async function uploadProfilePicture(file: File): Promise<string | undefined> {
  if (!file || file.size === 0) {
    return undefined;
  }

  const __dirname = path.resolve(); // Basisverzeichnis
  const uploadDir = path.join(__dirname, 'public', 'pps'); // Upload-Pfad

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // Verzeichnis erstellen, falls nicht vorhanden
  }

  const fileExtension = path.extname(file.name) || '.jpg';
  const fileName = `${createId()}${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer); // Datei speichern
    return `/pps/${fileName}`; // Pfad zur Datei zurückgeben
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to upload profile picture');
  }
}

export const updateUser = async (
    userId: number,
    data: {
      firstName?: string;
      lastName?: string;
      profilePicture?: string;
    }
) => {
  return await prisma.user.update({
    where: { id: userId },
    data,
  });
};


export const createUser = async (user: RegisterForm) => {
  const passwordHash = await bcrypt.hash(user.password, 10)
  const newUser = await prisma.user.create({
    data: {
      email: user.email,
      password: passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
    },
  })
  return { id: newUser.id, email: user.email }
}

export const getUserById = async (userId: number) => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
  })
}

export const getOtherUsers = async (userId: number) => {
  return prisma.user.findMany({
    where: {
      id: { not: userId },
    },
    orderBy: {
      firstName: 'asc',
    },
  })
}
// app/routes/logout.tsx
import { LoaderFunction } from "@remix-run/node";
import { logout } from "~/utils/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  return await logout(request);
};
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { ErrorResponse } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ rooms: any[] } | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const rooms = await prisma.room.findMany({
      include: {
        members: true,
        creator: true,
      },
      where: { isActive: true },
    });

    return res.status(200).json({ rooms });
  } catch (error) {
    console.error("Fetching rooms failed", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

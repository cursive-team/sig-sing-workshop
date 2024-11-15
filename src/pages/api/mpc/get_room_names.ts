import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { ErrorResponse } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ roomNames: any[] } | ErrorResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { roomId } = req.query;

  if (!roomId) {
    return res.status(400).json({ error: "Bad Request" });
  }

  try {
    const roomMembers = await prisma.roomMember.findMany({
      where: {
        roomId: parseInt(roomId.toString()),
      },
    });

    if (!roomMembers) {
      return res.status(404).json({ error: "Room not found" });
    }

    const roomNames = roomMembers
      .map((member) => member.displayName || `User-${member.id}`)
      .sort((a, b) => a.localeCompare(b));

    return res.status(200).json({ roomNames });
  } catch (error) {
    console.error("Fetching rooms failed", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

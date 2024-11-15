import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { verifyAuthToken } from "@/lib/server/auth";
import { ErrorResponse, EmptyResponse } from "@/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmptyResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { authToken, roomId } = JSON.parse(req.body);

  const userId = await verifyAuthToken(authToken);
  if (!userId) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: "Forbidden: Only the creator can expire the room" });
    }

    await prisma.room.update({
      where: { id: roomId },
      data: { isActive: false },
    });

    return res.status(200).json({});
  } catch (error) {
    console.error("Expiring room failed", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

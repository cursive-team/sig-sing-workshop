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

  const { roomId, password, displayName } = JSON.parse(req.body);

  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (password !== room.password) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    const memberCount = await prisma.roomMember.count({
      where: {
        roomId: roomId,
      },
    });
    if (memberCount >= room.numParties) {
      return res.status(400).json({ error: "Room is full" });
    }

    await prisma.roomMember.create({
      data: {
        roomId,
        displayName,
      },
    });

    return res.status(200).json({});
  } catch (error) {
    console.error("Joining room failed", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

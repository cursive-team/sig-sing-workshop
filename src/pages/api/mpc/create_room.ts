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

  const { authToken, name, numParties } = JSON.parse(req.body);

  const userId = await verifyAuthToken(authToken);
  if (!userId) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const existingRoom = await prisma.room.findMany({
      where: { name: name as string },
    });

    if (existingRoom.length > 0) {
      return res
        .status(400)
        .json({ error: "Room with this name already exists" });
    }

    const room = await prisma.room.create({
      data: {
        name,
        numParties,
        creatorId: userId,
      },
    });

    await prisma.roomMember.create({
      data: {
        roomId: room.id,
        userId,
      },
    });

    return res.status(201).json({});
  } catch (error) {
    console.error("Room creation failed", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

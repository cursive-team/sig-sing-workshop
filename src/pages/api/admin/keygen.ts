import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/server/prisma";
import { generateSignatureKeyPair } from "@/lib/shared/signature";
import { initialKeygenData } from "@/shared/keygen";
import { getServerRandomNullifierRandomness } from "@/lib/server/proving";

type CreateChipKeyData = {
  chipId: string;
  signaturePublicKey: string;
  signaturePrivateKey: string;
};

type PrecreateUserData = {
  chipId: string;
  isRegistered: boolean;
  isUserSpeaker: boolean;
  displayName: string;
  encryptionPublicKey: string;
  signaturePublicKey: string;
  psiPublicKeysLink: string;
};

type CreateLocationData = {
  id: number;
  chipId: string;
  name: string;
  stage: string;
  speaker: string;
  description: string;
  startTime: string;
  endTime: string;
  signaturePublicKey: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const password = req.body.password;
  if (password !== process.env.KEYGEN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const existingChipKey = await prisma.chipKey.findFirst();
  if (existingChipKey) {
    return res.status(400).json({ error: "Chip keys already exist" });
  }

  try {
    const allUserIds: number[] = [];
    const speakerUserIds: number[] = [];
    const allTalkIds: number[] = [];

    const allChipKeyData: CreateChipKeyData[] = [];
    const allUserData: PrecreateUserData[] = [];
    const allLocationData: CreateLocationData[] = [];

    let totalIndex = 1;
    let userIndex = 1;
    let locationIndex = 1;
    for (const [chipId, chipData] of Object.entries(initialKeygenData)) {
      console.log(
        "Generating keypair for chip",
        chipId,
        "(",
        totalIndex++,
        "of",
        Object.keys(initialKeygenData).length,
        ")"
      );

      // Generate and save signing keypair
      const { signingKey, verifyingKey } = generateSignatureKeyPair();
      allChipKeyData.push({
        chipId,
        signaturePublicKey: verifyingKey,
        signaturePrivateKey: signingKey,
      });

      // Logic for person chips
      if (chipData.type === "person") {
        // Precreate user object
        const isUserSpeaker = chipData.isPersonSpeaker ? true : false;
        allUserData.push({
          chipId,
          isRegistered: false,
          isUserSpeaker,
          displayName: chipId,
          encryptionPublicKey: "",
          signaturePublicKey: verifyingKey,
          psiPublicKeysLink: "",
        });
        allUserIds.push(userIndex);
        if (chipData.isPersonSpeaker) {
          speakerUserIds.push(userIndex);
        }
        userIndex++;

        // Logic for talk chips
      } else if (chipData.type === "talk") {
        const name = chipData.talkName ? chipData.talkName : "Example Talk";
        const stage = chipData.talkStage ? chipData.talkStage : "Example Stage";
        const speaker = chipData.talkSpeaker
          ? chipData.talkSpeaker
          : "Example Speaker";
        const description = chipData.talkDescription
          ? chipData.talkDescription
          : "Example Description";
        const startTime = chipData.talkStartTime
          ? chipData.talkStartTime
          : "12:00";
        const endTime = chipData.talkEndTime ? chipData.talkEndTime : "13:00";
        allLocationData.push({
          id: locationIndex,
          chipId,
          name,
          stage,
          speaker,
          description,
          startTime,
          endTime,
          signaturePublicKey: verifyingKey,
        });
        allTalkIds.push(locationIndex);
        locationIndex++;
      } else {
        console.error("Invalid keygen type, chipId:", chipId);
      }
    }

    // Create all chip keys
    await prisma.chipKey.createMany({
      data: allChipKeyData,
    });

    // Create all users
    await prisma.user.createMany({
      data: allUserData,
    });

    // Create all locations
    await prisma.location.createMany({
      data: allLocationData,
    });

    // BEGIN HARDCODED QUESTS FOR SIG SING WORKSHOP
    // Quest 1: Meet 10 attendees
    await prisma.quest.create({
      data: {
        name: "🦋 Symposium Seeker",
        description:
          "Connect with 10 people to make this proof. Ask to tap their ring, share socials, and discover event activity that you have in common.",
        userRequirements: {
          create: [
            {
              name: "Connect with 10 people at SigSing",
              numSigsRequired: 10,
              sigNullifierRandomness: getServerRandomNullifierRandomness(), // Ensures signatures cannot be reused to meet this requirement
              users: {
                connect: allUserIds.map((id) => ({ id })),
              },
            },
          ],
        },
        locationRequirements: {
          create: [],
        },
      },
    });

    // Quest 2: Meet 3 speakers
    await prisma.quest.create({
      data: {
        name: "🎤 Oracle Encounter",
        description:
          "Ask 3 speakers a question or share feedback about their talk. Ask to tap their ring to collect a link to their presentation slides (if available)",
        userRequirements: {
          create: [
            {
              name: "Connect with 3 speakers at the Sig Sing workshop",
              numSigsRequired: 3,
              sigNullifierRandomness: getServerRandomNullifierRandomness(), // Ensures signatures cannot be reused to meet this requirement
              users: {
                connect: speakerUserIds.map((id) => ({ id })),
              },
            },
          ],
        },
        locationRequirements: {
          create: [],
        },
      },
    });

    // Quest 3: Attend 5 talks
    // await prisma.quest.create({
    //   data: {
    //     name: "👩‍🏫 Acropolis Assembler",
    //     description:
    //       "Tap in to 5 talks at Zk Summit 11 to make this proof. Look for cards on posters at conference room entrances.",
    //     userRequirements: {
    //       create: [],
    //     },
    //     locationRequirements: {
    //       create: [
    //         {
    //           name: "Attend 5 talks at ZK Summit 11",
    //           numSigsRequired: 5,
    //           sigNullifierRandomness: getServerRandomNullifierRandomness(), // Ensures signatures cannot be reused to meet this requirement
    //           locations: {
    //             connect: allTalkIds.map((id) => ({ id })),
    //           },
    //         },
    //       ],
    //     },
    //   },
    // });
    // END HARDCODED QUESTS FOR SIG SING WORKSHOP

    res.status(200).json({});
  } catch (error) {
    console.log("Failed to generate keys", error);
    res.status(500).json({ error: "Failed to generate keys" });
  }
}

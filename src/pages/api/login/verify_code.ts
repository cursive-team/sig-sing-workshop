import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import {
  verifySigninCode,
  generateAuthToken,
  AuthTokenResponse,
} from "../_auth";
import { ErrorResponse } from "../_types";
import { BackupResponse } from "../backup";
import { decryptString } from "@/lib/backup";

export type LoginResponse =
  | {
      authToken: AuthTokenResponse;
      backup: BackupResponse;
      password:
        | {
            salt: string;
            hash: string;
          }
        | undefined;
    }
  | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const verifyResponse = await verifySigninCode(email, code, true);
  if (!verifyResponse.success) {
    return res
      .status(401)
      .json({ error: verifyResponse.reason || "Code verification failed" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Generate auth token
  const authToken = await generateAuthToken(user.id);

  // Get latest backup
  // TODO: Might want to perform some logic here ensuring the backup encryption method matches the current user custody preference
  const backup = await prisma.backup.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (!backup) {
    return res.status(404).json({ error: "Backup not found" });
  }

  const { encryptedData, authenticationTag, iv } = backup;

  if (backup.isServerEncrypted) {
    const serverEncryptionEmail = process.env.SERVER_ENCRYPTION_EMAIL!;
    const serverEncryptionPassword = process.env.SERVER_ENCRYPTION_PASSWORD!;
    const decryptedBackup = decryptString(
      encryptedData,
      authenticationTag,
      iv,
      serverEncryptionEmail,
      serverEncryptionPassword
    );

    return res.status(200).json({
      authToken,
      backup: { decryptedData: decryptedBackup },
      password: undefined,
    });
  } else {
    if (!user.passwordSalt || !user.passwordHash) {
      return res.status(404).json({ error: "Password not found" });
    }

    return res.status(200).json({
      authToken,
      backup: {
        encryptedData,
        authenticationTag,
        iv,
      },
      password: {
        salt: user.passwordSalt,
        hash: user.passwordHash,
      },
    });
  }
}

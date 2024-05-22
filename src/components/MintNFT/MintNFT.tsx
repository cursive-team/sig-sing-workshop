"use client";

import { ethers } from "ethers";
import { Button } from "../Button";
import { Input } from "../Input";
import { ABI, CONTRACT_ADDRESS } from "./config";
import { useState } from "react";
import { toast } from "sonner";
import { groth16 } from "snarkjs";
import { generateMetadata, uploadToPinata } from "./pinata.helper";
import { useMutation } from "@tanstack/react-query";
import {
  getFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/client/localStorage";

interface MintNFTProps<T> {
  input: T;
  user: any;
  proof: any;
  pub: any;
}

export const NFT_STORAGE_KEY = "mintedNFTs";

const MintNFT = ({ input, user, proof, pub }: MintNFTProps<any>) => {
  const WALLET_PRIVATE_KEY = process.env
    .NEXT_PUBLIC_WALLET_PRIVATE_KEY as string;
  const INFURA_URL = process.env.NEXT_PUBLIC_INFURA_URL as string;

  const provider = new ethers.JsonRpcProvider(INFURA_URL);
  const signer = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  const [recipient, setRecipient] = useState<string>("");
  const [isValidRecipient, setIsValidRecipient] = useState<boolean>(false);

  const mintedNFTs = JSON.parse(getFromLocalStorage(NFT_STORAGE_KEY) || "[]");

  const username = user.name;

  const hasAlreadyMinted = mintedNFTs[user.pkId] !== undefined;

  const verifyAndMint = async (to: string): Promise<any> => {
    try {
      const tokenId = await contract._nextTokenId(); // get the next token ID

      if (!ethers.isAddress(to)) {
        toast.error("Invalid or missing address");
        return;
      }
      if (!WALLET_PRIVATE_KEY) {
        throw new Error("WALLET_PRIVATE_KEY is not set");
      }

      const nextTokenId = Number(tokenId.toString()) + 1;

      // Generate metadata and upload to Pinata
      const metadata = await generateMetadata({
        username,
        tokenID: nextTokenId,
      });

      const pinataResponse = await uploadToPinata(metadata);
      const metadataURI = `ipfs://${pinataResponse.IpfsHash}`;

      const callData = undefined; // groth16.exportSolidityCallData(proof, pub);
      const tx = await contract.verifyAndMint(to, metadataURI, callData);

      // store details for user that i minted NFTs
      saveNTFDetails(user.pkId, nextTokenId);

      return tx.wait(); // wait for the transaction to be mined
    } catch (error) {
      console.error("Error minting NFT", error);
      toast.error("Something went wrong, please try it again.");
    }
  };

  // store user that i minted NFTs in local storage
  const saveNTFDetails = (pkId: string, tokenID: string | number) => {
    let items = JSON.parse(getFromLocalStorage(NFT_STORAGE_KEY) || "{}");

    // store mapping of user pkId to tokenID
    items = {
      ...items,
      [pkId]: tokenID,
    };
    saveToLocalStorage(NFT_STORAGE_KEY, JSON.stringify(items));
  };

  const verifyAndMintMutation = useMutation({
    mutationFn: verifyAndMint,
    onError: (error) => {
      console.error("Error minting NFT", error);
    },
  });

  if (hasAlreadyMinted) {
    return (
      <div className="p-4 text-center font-semibold">
        Already collected NFT for this user
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4">
      <Input
        label="Recipient"
        placeholder="0x..."
        value={recipient}
        onChange={(e) => {
          const recipient = e?.target?.value;
          setRecipient(recipient);
          setIsValidRecipient(ethers.isAddress(recipient));
        }}
        error={
          recipient.length == 0
            ? undefined
            : isValidRecipient
            ? undefined
            : "Invalid address"
        }
      />
      <Button
        disabled={recipient.length === 0}
        loading={verifyAndMintMutation.isPending}
        onClick={() => {
          verifyAndMintMutation.mutateAsync(recipient);
        }}
      >
        {verifyAndMintMutation.isPending ? "Minting..." : "Mint NFT"}
      </Button>
    </div>
  );
};

MintNFT.displayName = "MintNFT";

export { MintNFT };

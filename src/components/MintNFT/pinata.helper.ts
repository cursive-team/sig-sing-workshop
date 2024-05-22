interface MetadataProps {
  username: string;
  tokenID: string | number;
}

export const generateMetadata = async ({
  username,
  tokenID,
}: MetadataProps): Promise<any> => {
  const metadata = {
    name: `Meet - #${username}`,
    description: "A demo of cursive nft",
    image:
      "https://ipfs.io/ipns/k51qzi5uqu5dh5syrvl2wlrrq0dkrw3v4yzn0tpqaet57fva0j03gveub20bcm",
    attributes: [
      {
        trait_type: "ID",
        display_type: "number",
        value: Number(tokenID),
      },
      {
        trait_type: "Date",
        display_type: "date",
        value: new Date().getTime(),
      },
    ],
    traits: [],
  };

  console.log("generated metadata:", metadata);

  return metadata;
};

export const uploadToPinata = async (metadata: any) => {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const response = await fetch(url, {
    method: "POST",
    // @ts-ignore
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
      pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
    },
    body: JSON.stringify(metadata),
  });
  const data = await response.json();
  return data;
};

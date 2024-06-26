import { Button } from '@/components/Button';
import { useEffect, useState } from 'react';
import { getLocationSignatures, getUsers } from '@/lib/client/localStorage';
import { MembershipFolder } from '@/lib/client/nova';
import { Spinner } from '@/components/Spinner';
import { toast } from 'sonner';
import { useWorker } from '@/hooks/useWorker';
import { TreeType } from '@/lib/client/indexDB';
import { IndexDBWrapper } from '@/lib/client/indexDB';

export default function Fold() {
  const { work, finalize, folding, completed } = useWorker();
  const [canFinalize, setCanFinalize] = useState<boolean>(false);
  const [canVerify, setCanVerify] = useState<boolean>(false);
  const [chunks, setChunks] = useState<Array<Blob>>([]);
  const [db, setDB] = useState<IndexDBWrapper | null>(null);
  const [isProving, setIsProving] = useState<boolean>(false);
  const [numFolded, setNumFolded] = useState<number>(0);

  useEffect(() => {
    if (db) return;
    (async () => {
      // Init IndexDB
      const db = new IndexDBWrapper();
      await db.init();
      setDB(db);
    })();
  }, []);

  useEffect(() => {
    if (completed || !db || folding) return;
    // get the proof attendee type
    (async () => {
      // get params
      const params = new Blob(await db.getChunks());

      // instantiate wasm
      const wasm = await import("bjj_ecdsa_nova_wasm");
      await wasm.default();
      // let concurrency = Math.floor(navigator.hardwareConcurrency / 3) * 2;
      // if (concurrency < 1) concurrency = 1;
      // let concurrency = Math.floor(navigator.hardwareConcurrency) / 3;
      // await wasm.initThreadPool(concurrency);
      let membershipFolder = await MembershipFolder.initWithIndexDB(params, wasm);
      // get all attendees
      const talkProof = await db.getFold(TreeType.Talk);

      const speakerProof = await db.getFold(TreeType.Speaker);
      const attendeeProof = await db.getFold(TreeType.Attendee);
      if (talkProof) {
        let decompressed = await membershipFolder.decompressProof(new Uint8Array(await talkProof.proof.arrayBuffer()));
        let res = await membershipFolder.verify(decompressed, talkProof.numFolds, TreeType.Talk, false);
        console.log("Res: ", res)
      }
      if (speakerProof) {
        let decompressed = await membershipFolder.decompressProof(new Uint8Array(await speakerProof.proof.arrayBuffer()));
        let res = await membershipFolder.verify(decompressed, speakerProof.numFolds, TreeType.Speaker, false);
        console.log("Res: ", res)
      }
      if (attendeeProof) {
        let decompressed = await membershipFolder.decompressProof(new Uint8Array(await attendeeProof.proof.arrayBuffer()));
        let res = await membershipFolder.verify(decompressed, attendeeProof.numFolds, TreeType.Attendee, false);
        console.log("Res: ", res)
      }
    })();
  }, [db, completed]);

  // const finalize = async () => {
  //   if (!db) return;
  //   // get proof from indexdb
  //   setIsProving(true);
  //   const proofData = await db.getFold(TreeType.Attendee);
  //   if (proofData === undefined) {
  //     toast.error('No proof to finalize!');
  //     setIsProving(false);
  //     return;
  //   } else if (proofData.obfuscated === true) {
  //     toast.error('Proof has already been finalized!');
  //     setIsProving(false);
  //     return;
  //   }

  //   // Obfuscate in web worker
  //   await obfuscateFold();
  //   setCanFinalize(false);
  //   setCanVerify(true);
  //   setIsProving(false);
  //   toast.success(
  //     `Finalized folded proof of ${proofData.numFolds} attendees met!`
  //   );
  // };

  // const fold = async () => {
  //   if (!db) return;
  //   setIsProving(true);
  //   // get users who are not speakers


  //   // get user that can be folded in
  //   let foldableUsers = await db.getUsersToFold(TreeType.Attendee, users);
  //   if (foldableUsers === undefined) {
  //     toast.info('No attendees to fold in!');
  //     setIsProving(false);
  //     return;
  //   }

  //   // Get proof count
  //   const proof = await db.getFold(TreeType.Attendee);
  //   const proofCount = proof?.numFolds ?? 0;

  //   await foldAll(foldableUsers);
  //   setCanFinalize(true);
  //   setIsProving(false);
  //   toast.success(
  //     `Folded proofs of ${proofCount + foldableUsers.length} attendees met!`
  //   );
  // };

  // const verify = async () => {
  //   if (!db) return;
  //   setIsProving(true);
  //   // get proof from indexdb
  //   const proofData = await db.getFold(TreeType.Attendee);
  //   if (proofData === undefined) {
  //     toast.error('No proof to verify!');
  //     return;
  //   } else if (proofData.obfuscated === false) {
  //     toast.error('Proof has not been finalized!');
  //     return;
  //   }

  //   const params = new Blob(chunks);
  //   // Initialize membership folder
  //   const membershipFolder = await MembershipFolder.initWithIndexDB(params);

  //   // decompress proof
  //   const proof = await membershipFolder.decompressProof(
  //     new Uint8Array(await proofData.proof.arrayBuffer())
  //   );
  //   await membershipFolder.verify(proof, proofData.numFolds, true);
  //   setIsProving(false);
  //   toast.success(
  //     `Verified folded proof of ${proofData.numFolds} attendees met!`
  //   );
  // };

  return (
    <div>
      {/* {!chunks.length ? (
        <></>
      ) : (
        <>
          {numFolded !== 0 ? (
            <>
              <p>Number of proofs folded: {numFolded}</p>
              {canFinalize && !isProving && (
                <Button onClick={() => finalize()}>Finalize Proof</Button>
              )}
              {canVerify && !isProving && (
                <Button onClick={() => verify()}>Verify Proof</Button>
              )}
            </>
          ) : (
            <>
              {!isProving && (
                <Button onClick={() => fold()}>Generate Proof</Button>
              )}
            </>
          )}
          {isProving && <Spinner />}
        </>
      )} */}
    </div>
  );
}
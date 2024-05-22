import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { Wallet } from "ethers";

const CursiveModule = buildModule("CursiveModule", (m) => {
  const verifier = m.contract("Groth16Verifier", [], {});

  const address = Wallet.createRandom().address;
  const cursive = m.contract("Cursive", ["Cursive", "CRSV", address], {});

  return { cursive };
});

export default CursiveModule;

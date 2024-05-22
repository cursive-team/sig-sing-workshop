const modules = require("@nomicfoundation/hardhat-ignition/modules");
const VerifierModule = require("./Verifier");

module.exports = modules.buildModule("DeployModule", (m: any) => {
  const userCanOwnMultipleItems = true; // this flag is used to determine if Cursive smart contract should allow multiple NFTs to a user
  const { verifier } = m.useModule(VerifierModule);

  const cursive = m.contract("Cursive", [
    "Cursive",
    "CRSV",
    verifier,
    userCanOwnMultipleItems,
  ]);

  return { cursive, verifier };
});

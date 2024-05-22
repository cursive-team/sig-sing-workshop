const m = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = m.buildModule("VerifierModule", (m) => {
  const verifier = m.contract("Groth16Verifier", [], {});

  return { verifier };
});

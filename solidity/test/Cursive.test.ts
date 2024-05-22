const hre = require("hardhat");
const { expect } = require("chai");
const { Wallet, BigNumber } = require("ethers");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
require("@nomicfoundation/hardhat-chai-matchers");

export const MOCK_CALLDATA_VALID_PROOF = [
  [
    "0x0d798e66bfc3f8a49b5ccc4c761adecee68e5ab1e8af08c8466c40aaefbb66bc",
    "0x08c829d0a3fff2693c81971af839d6fd56304a054f0ec1dd843f3fc5118421a1",
  ],
  [
    [
      "0x1fea5eac023edee48475ae63f83d84357951da850704dc4f59f390fb382b0248",
      "0x248a3857f0f0ea516526760555f21031b693df9fd4e75c7972e4b208fea74a3d",
    ],
    [
      "0x0c9dcb4a1874ccef1c8e893b9fd41d8c574833894234c52c656254b341e0ba74",
      "0x16f0f22499c8409b5abfef835618f0f5080e24693c0c827394e5cbbc51099d1e",
    ],
  ],
  [
    "0x21f272d6947dac039cb8d5a29d1bda7f0cd9ee57cc3aa43569e938e838e43590",
    "0x07c9953cc6ed8fe5691bff7e1216a64c6728aaa92183e6682f99b4fede4bd124",
  ],
  [
    "17825334909698573620993222371821585663772073121519814540615199066752100895281",
    "9949682763199094406947497597619206603576319427215228151667831375779683522772",
    "19014214495641488759237505126948346942972912379615652741039992445865937985820",
    "1799182282238172949735919814155076722550339245418717182904975644657694908682",
    "11796026433945242671642728009981778919257130899633207712788256867701213124641",
    "14123514812924309349601388555201142092835117152213858542018278815110993732603",
    "0",
    "1",
    "0",
  ],
];

const MOCK_CALLDATA_INVALID_PROOF = [
  [Wallet.createRandom().address, Wallet.createRandom().address],
  [
    [
      "0x1fea5eac023edee48475ae63f83d84357951da850704dc4f59f390fb382b0248",
      "0x248a3857f0f0ea516526760555f21031b693df9fd4e75c7972e4b208fea74a3d",
    ],
    [
      "0x0c9dcb4a1874ccef1c8e893b9fd41d8c574833894234c52c656254b341e0ba74",
      "0x16f0f22499c8409b5abfef835618f0f5080e24693c0c827394e5cbbc51099d1e",
    ],
  ],
  [
    "0x21f272d6947dac039cb8d5a29d1bda7f0cd9ee57cc3aa43569e938e838e43590",
    "0x07c9953cc6ed8fe5691bff7e1216a64c6728aaa92183e6682f99b4fede4bd124",
  ],
  [
    "17825334909698573620993222371821585663772073121519814540615199066752100895281",
    "9949682763199094406947497597619206603576319427215228151667831375779683522772",
    "19014214495641488759237505126948346942972912379615652741039992445865937985820",
    "1799182282238172949735919814155076722550339245418717182904975644657694908682",
    "11796026433945242671642728009981778919257130899633207712788256867701213124641",
    "14123514812924309349601388555201142092835117152213858542018278815110993732603",
    "0",
    "1",
    "0",
  ],
];

const TOKEN_URI_BASE = "https://token-uri.com/";
const RECIPIENT_ADDRESS = "0x43770d2ec1C3365B6255caEE61dc3150c29a212e";

interface ContractParams {
  multipleItems?: boolean;
}

describe("Cursive multiple items", function () {
  async function deployContracts() {
    const MULTIPLE_ITEMS = true;
    // Deploy Verifier contract
    const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();

    // Deploy Cursive contract
    const [owner, otherAccount, recipient] = await hre.ethers.getSigners();
    const Cursive = await hre.ethers.getContractFactory("Cursive");
    const cursive = await Cursive.deploy(
      "Cursive",
      "CRSV",
      verifier.target,
      MULTIPLE_ITEMS
    );

    return { cursive, owner, otherAccount, verifier, recipient };
  }

  describe("Deployment", function () {
    it("Should deploy with correct params", async function () {
      const { verifier, cursive, owner } = await loadFixture(deployContracts);

      expect(await cursive.owner()).to.equal(owner.address);
      expect(await cursive._verifierAddress()).to.equal(verifier.target);
    });
  });

  describe("Verify and mint", function () {
    it("Should mint NFT with valid proof", async function () {
      const { cursive } = await loadFixture(deployContracts);

      const prevTokenId = hre.ethers.toNumber(await cursive._nextTokenId());
      const nextTokenId = prevTokenId + 1;
      expect(prevTokenId).not.to.be.null;

      await expect(
        cursive.verifyAndMint(
          RECIPIENT_ADDRESS,
          TOKEN_URI_BASE,
          MOCK_CALLDATA_VALID_PROOF
        )
      ).to.not.be.reverted;

      // check that tokenId has increased
      expect(await cursive._nextTokenId()).to.equal(nextTokenId);

      // check that recipient has the token
      expect(await cursive.ownerOf(nextTokenId)).to.equal(RECIPIENT_ADDRESS);
    });

    it("Should not mint NFT with invalid proof", async function () {
      const { cursive } = await loadFixture(deployContracts);

      const prevTokenId = hre.ethers.toNumber(await cursive._nextTokenId());
      expect(prevTokenId).not.to.be.null;

      await expect(
        cursive.verifyAndMint(
          RECIPIENT_ADDRESS,
          TOKEN_URI_BASE,
          MOCK_CALLDATA_INVALID_PROOF
        )
      ).to.be.reverted;

      // check that tokenId has not increased
      expect(await cursive._nextTokenId()).to.equal(0);
    });
  });

  it("Verify and mint multiple items", async function () {
    const { cursive } = await loadFixture(deployContracts);

    const ITEMS_TO_MINT = 4;
    // check that balance is 0
    const balanceBefore = hre.ethers.toNumber(
      await cursive.balanceOf(RECIPIENT_ADDRESS)
    );

    expect(balanceBefore).to.equal(0);

    // check that multiple items are minted
    await Promise.all(
      Array.from({ length: ITEMS_TO_MINT }).map(() =>
        cursive.verifyAndMint(
          RECIPIENT_ADDRESS,
          TOKEN_URI_BASE,
          MOCK_CALLDATA_VALID_PROOF
        )
      )
    );

    // check that recipient has all the NFTS
    const balanceAfter = hre.ethers.toNumber(
      await cursive.balanceOf(RECIPIENT_ADDRESS)
    );

    expect(balanceAfter).to.equal(ITEMS_TO_MINT);
  });
});

describe("Cursive unique items", function () {
  async function deployContracts() {
    const MULTIPLE_ITEMS = false;
    // Deploy Verifier contract
    const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();

    // Deploy Cursive contract
    const [owner, otherAccount, recipient] = await hre.ethers.getSigners();
    const Cursive = await hre.ethers.getContractFactory("Cursive");
    const cursive = await Cursive.deploy(
      "Cursive",
      "CRSV",
      verifier.target,
      MULTIPLE_ITEMS // allow multiple items
    );

    return { cursive, owner, otherAccount, verifier, recipient };
  }

  describe("Deployment", function () {
    it("Should deploy with correct params", async function () {
      const { verifier, cursive, owner } = await loadFixture(deployContracts);

      expect(await cursive.owner()).to.equal(owner.address);
      expect(await cursive._verifierAddress()).to.equal(verifier.target);
    });
  });

  it("Verify and mint unique item", async function () {
    const { cursive } = await loadFixture(deployContracts);

    const ITEMS_TO_MINT = 4;
    // check that balance is 0
    const balanceBefore = hre.ethers.toNumber(
      await cursive.balanceOf(RECIPIENT_ADDRESS)
    );

    expect(balanceBefore).to.equal(0);

    // mint the first item
    await cursive.verifyAndMint(
      RECIPIENT_ADDRESS,
      TOKEN_URI_BASE,
      MOCK_CALLDATA_VALID_PROOF
    );

    // check that is not possible mint again
    await expect(
      cursive.verifyAndMint(
        RECIPIENT_ADDRESS,
        TOKEN_URI_BASE,
        MOCK_CALLDATA_VALID_PROOF
      )
    ).to.be.reverted;

    // check that recipient only one NFT
    const balanceAfter = hre.ethers.toNumber(
      await cursive.balanceOf(RECIPIENT_ADDRESS)
    );

    expect(balanceAfter).to.equal(1);
  });
});

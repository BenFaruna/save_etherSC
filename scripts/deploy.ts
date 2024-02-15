import { ethers } from "hardhat";

async function main() {

  const save = await ethers.deployContract("SaveEther");

  await save.waitForDeployment();

  console.log(
    `SaveEther deployed to ${save.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

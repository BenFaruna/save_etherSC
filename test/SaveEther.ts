import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SaveEther", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySaveEtherFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const SaveEther = await ethers.getContractFactory("SaveEther");
    const save = await SaveEther.deploy();

    return { save, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should create an instance of the contract with an empty balance", async function () {
      const { save } = await loadFixture(deploySaveEtherFixture);
      expect(await save.checkContractBal()).to.equal(0);
    });
  });
  describe("Deposit", function () {
    it("Should revert with zero deposit", async () => {
      const { save } = await loadFixture(deploySaveEtherFixture);

      await expect(save.deposit({ value: ethers.parseEther("0") }))
        .to.be.revertedWith("cannot save zero value");
    });
    it("Should update contract balance after deposit", async () => {
      const { save } = await loadFixture(deploySaveEtherFixture);
      await save.deposit({ value: ethers.parseEther("10") })

      expect((await save.checkContractBal()).toString())
        .to.be.equal(ethers.parseEther("10"));
    });
    it("Should update the address savings", async () => {
      const { save, owner } = await loadFixture(deploySaveEtherFixture);
      await save.connect(owner).deposit({ value: ethers.parseEther("10") })

      expect((await save.checkSavings(owner.address)).toString())
        .to.be.equal(ethers.parseEther("10"));
      await save.deposit({ value: ethers.parseEther("0.005") })

      expect((await save.checkSavings(owner.address)).toString())
        .to.be.equal(ethers.parseEther("10.005"));
    });
    it("Should emit SavingsSuccess after deposit", async () => {
      const { save, owner } = await loadFixture(deploySaveEtherFixture);
      const depositValue = ethers.parseEther("100")

      await expect(save.connect(owner).deposit({ value: depositValue }))
        .to.emit(save, "SavingsSuccess")
        .withArgs(owner.address, depositValue);
    });
  });
  describe("Withdraw", function () {
    it("Should revert when address does not have any savings", async () => {
      const { save } = await loadFixture(deploySaveEtherFixture);

      await expect(save.withdraw()).to.be.revertedWith("no savings for user");
    });
    it("Should reduce user savings to zero after withdraw", async () => {
      const { save, owner } = await loadFixture(deploySaveEtherFixture);
      await save.connect(owner).deposit({ value: ethers.parseEther("100") })
      await save.connect(owner).withdraw()

      await expect((await save.checkSavings(owner.address)).toString())
        .to.be.equal(ethers.parseEther("0"));
    });
    it("Should emit WithdrawalSuccess after withdrawal", async () => {
      const { save, owner } = await loadFixture(deploySaveEtherFixture);
      await save.connect(owner).deposit({ value: ethers.parseEther("100") })
      const userDeposit = (await save.checkSavings(owner.address)).toString()

      await expect(save.connect(owner).withdraw())
        .to.emit(save, "WithdrawalSuccess")
        .withArgs(owner.address, userDeposit)
    });
  });
  describe("SendOutSavings", function () {
    it("Should revert when user try to send zero value", async () => {
      const { save, owner, otherAccount } = await loadFixture(deploySaveEtherFixture);

      await expect(save.connect(owner).sendOutSavings(otherAccount.address, "0"))
        .to.be.revertedWith("cannot send zero value");

      await save.connect(owner).deposit({ value: ethers.parseEther("10") });

      await expect(save.connect(owner).sendOutSavings(otherAccount.address, "0"))
        .to.be.revertedWith("cannot send zero value");
    });
    it("Should revert when user try to send value greater than savings", async () => {
      const { save, owner, otherAccount } = await loadFixture(deploySaveEtherFixture);
      await save.connect(owner).deposit({ value: ethers.parseEther("10") });

      await expect(save.connect(owner).sendOutSavings(otherAccount.address, ethers.parseEther("100")))
        .to.be.revertedWith("cannot send amount greater than savings");
    });
    it("Should reduce user balance after sending out savings", async () => {
      const { save, owner, otherAccount } = await loadFixture(deploySaveEtherFixture);
      await save.connect(owner).deposit({ value: ethers.parseEther("10") });
      await save.connect(owner).sendOutSavings(otherAccount.address, ethers.parseEther("9"));

      expect((await save.checkSavings(owner.address)).toString())
        .to.be.equal(ethers.parseEther("1"));

      await save.connect(owner).sendOutSavings(otherAccount.address, ethers.parseEther("1"));

      expect((await save.checkSavings(owner.address)).toString())
        .to.be.equal(ethers.parseEther("0"));
    });
    it("Should transfer the value to the right address", async () => {
      const { save, owner, otherAccount } = await loadFixture(deploySaveEtherFixture);
      const ethervalue = ethers.parseEther("9")

      await save.connect(owner).deposit({ value: ethers.parseEther("10") });

      await expect(await save.connect(owner).sendOutSavings(otherAccount.address, ethervalue))
        .to.be.changeEtherBalance(otherAccount, ethervalue);
    });
  });
});

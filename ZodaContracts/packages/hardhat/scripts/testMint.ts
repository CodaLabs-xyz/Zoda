import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { EventLog } from "ethers";
dotenv.config();

async function main() {
  // Get proxy address from .env
  const proxyAddress = process.env.PROXY_CONTRACT_ADDRESS;
  if (!proxyAddress) {
    throw new Error("PROXY_CONTRACT_ADDRESS not set in .env");
  }

  // Get contract instance
  const zodaNFT = await ethers.getContractAt("ZodaNFT", proxyAddress);

  // Get the mint fee
  const mintFee = await zodaNFT.mintFee();
  console.log("\n💰 Current mint fee:", ethers.formatEther(mintFee), "ETH");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("🔑 Minting from address:", await signer.getAddress());

  // Check signer's balance
  const balance = await ethers.provider.getBalance(signer.getAddress());
  console.log("💳 Account balance:", ethers.formatEther(balance), "ETH");

  // Example metadata URI - replace with your actual metadata
  const metadataURI = "ipfs://QmExample/1.json";

  console.log("\n🚀 Attempting to mint NFT...");
  console.log("📝 Metadata URI:", metadataURI);

  try {
    // Mint NFT
    const tx = await zodaNFT.mint(
      await signer.getAddress(), // mint to the same address
      metadataURI,
      { value: mintFee } // send the required mint fee
    );

    console.log("⏳ Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction failed");
    
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Get the token ID from the event
    const mintEvent = receipt.logs.find((log): log is EventLog => {
      return log instanceof EventLog && log.fragment.name === "NFTMinted";
    });

    if (mintEvent) {
      const tokenId = mintEvent.args[1]; // tokenId is the second argument in the event
      console.log("\n🎉 Success! Minted token ID:", tokenId.toString());

      // Get token URI to verify metadata
      const tokenURI = await zodaNFT.tokenURI(tokenId);
      console.log("🔗 Token URI:", tokenURI);

      // Verify ownership
      const owner = await zodaNFT.ownerOf(tokenId);
      console.log("👤 Token owner:", owner);
    }

  } catch (error: any) {
    console.error("\n❌ Minting failed:");
    if (error.data) {
      // If it's a contract error
      console.error("Contract error message:", error.data.message);
    } else {
      // If it's a transaction error
      console.error(error.message);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
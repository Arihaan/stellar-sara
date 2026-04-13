import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";

const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";

async function main() {
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  console.log("=== New Stellar Testnet Wallet ===");
  console.log(`Public Key:  ${publicKey}`);
  console.log(`Secret Key:  ${secretKey}`);
  console.log("");

  // Fund via Friendbot
  console.log("Funding account via Friendbot...");
  const friendbotRes = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!friendbotRes.ok) {
    throw new Error(`Friendbot failed: ${friendbotRes.status} ${await friendbotRes.text()}`);
  }
  console.log("Funded with testnet XLM.");

  // Create USDC trustline
  console.log("Creating USDC trustline...");
  const server = new Horizon.Server(HORIZON_URL);
  const account = await server.loadAccount(publicKey);
  const usdcAsset = new Asset("USDC", USDC_ISSUER);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: usdcAsset }))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  await server.submitTransaction(tx);
  console.log("USDC trustline created.");

  console.log("");
  console.log("=== NEXT STEPS ===");
  console.log("1. Add this to your .env.local file:");
  console.log(`   STELLAR_PRIVATE_KEY=${secretKey}`);
  console.log(`   STELLAR_PUBLIC_KEY=${publicKey}`);
  console.log("");
  console.log("2. Fund with testnet USDC:");
  console.log("   Go to https://faucet.circle.com/");
  console.log("   Select 'Stellar Testnet'");
  console.log(`   Paste your public key: ${publicKey}`);
  console.log("");
  console.log("3. Verify balance at:");
  console.log(`   https://horizon-testnet.stellar.org/accounts/${publicKey}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

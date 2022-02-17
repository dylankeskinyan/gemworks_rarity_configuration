import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { NodeWallet } from "@metaplex/js";
import { Wallet } from "@project-serum/anchor";
import farmIdl from "./idl/gem_farm.json";
import bankIdl from "./idl/gem_bank.json";
import {
  findRarityPDA,
  GemFarmClient,
  RarityConfig,
} from "@gemworks/gem-farm-ts";

export const stakingDefaults = {
  CLUSTER: "devnet",

  GEM_BANK_PROG_ID: new PublicKey(
      // TODO bank program id
  ),

  GEM_FARM_PROG_ID: new PublicKey(
      // TODO farm program id
  ),

  FARM_ID: new PublicKey(
      // TODO farm id
  ),
};

// This is the rarity array that you configure, each object consists of the
// NFT mint address and the rarity points associated with it.
const rarities: RarityConfig[] = [
  {
    mint: new PublicKey("4NTyHQugCrsYPfgqo5k2UU2vuFhVwz5X8o3QWvMTX3Sq"), // The NFT address
    rarityPoints: 4, // < this is the rarity multiplier
  },
  // It's an array, you can put as many rarity configurations as you want
];

(async () => {
  const connection = new Connection(
      clusterApiUrl(stakingDefaults.CLUSTER as any),
      "confirmed"
  );

  // This keypair needs to be the farm manager
  const manager = Keypair.fromSecretKey(
      Uint8Array.from(
          // TODO Wallet private key here
          []
      )
  );

  let gf = new GemFarmClient(
      connection,
      new NodeWallet(manager) as Wallet,
      farmIdl as any,
      stakingDefaults.GEM_FARM_PROG_ID,
      bankIdl as any,
      stakingDefaults.GEM_BANK_PROG_ID
  );

  const farm = await gf.fetchFarmAcc(stakingDefaults.FARM_ID);

  // This executes the transaction to apply the rarities
  const { txSig } = await gf.addRaritiesToBank(
      stakingDefaults.FARM_ID,
      manager,
      rarities
  );
  await connection.confirmTransaction(txSig);
  console.log(txSig);

  // You can retrieve it this way to check if it has been stored correctly
  const [rarityAddr] = await findRarityPDA(
      farm.bank,
      new PublicKey("4NTyHQugCrsYPfgqo5k2UU2vuFhVwz5X8o3QWvMTX3Sq")
  );

  const rarityAcc = await gf.fetchRarity(rarityAddr);
  console.log(rarityAcc);
})();
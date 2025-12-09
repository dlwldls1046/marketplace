import { usePublicClient } from "wagmi";
import { marketplaceContractAddress } from "@/lib/constants";
import marketplaceAbi from "@/lib/marketplaceAbi.json";
import { useQuery } from "@tanstack/react-query";
import { parseAbiItem } from "viem";

export interface Listing {
  tokenId: bigint;
  price: bigint;
  seller: string;
  isListed: boolean;
}

export function useMarketplaceListings() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["marketplace-listings"],
    queryFn: async () => {
      if (!publicClient) return [];

      // 최신 블록 번호 가져오기
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > 50000n ? latestBlock - 50000n : 0n;

      console.log("📌 LatestBlock:", latestBlock.toString());
      console.log("📌 Fetching logs from:", fromBlock.toString());

      const listedEvent = parseAbiItem(
        "event Listed(uint256 indexed tokenId, address indexed seller, uint256 price)"
      );

      // 📌 최신 50,000 블록만 스캔
      const logs = await publicClient.getLogs({
        address: marketplaceContractAddress as `0x${string}`,
        event: listedEvent,
        fromBlock,
        toBlock: "latest",
      });

      console.log("📢 LOGS:", logs);

      const tokenIds = Array.from(
        new Set(
          logs
            .filter((l) => l.args && l.args.tokenId !== undefined)
            .map((l) => l.args!.tokenId as bigint)
        )
      );

      console.log("📢 tokenIds:", tokenIds);

      if (tokenIds.length === 0) return [];

      const results = await publicClient.multicall({
        contracts: tokenIds.map((tokenId) => ({
          address: marketplaceContractAddress as `0x${string}`,
          abi: marketplaceAbi as any,
          functionName: "listings",
          args: [tokenId],
        })),
      });

      const activeListings: Listing[] = [];

      results.forEach((result, i) => {
        if (result.status === "success") {
          const [seller, price, isListed] =
            result.result as [string, bigint, boolean];

          if (isListed) {
            activeListings.push({
              tokenId: tokenIds[i],
              price,
              seller,
              isListed,
            });
          }
        }
      });

      return activeListings;
    },
    enabled: !!publicClient,
  });
}

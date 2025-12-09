import { usePublicClient, useAccount } from 'wagmi'
import { nftContractAddress } from '@/lib/constants'
import nftAbi from '@/lib/nftAbi.json'
import { useQuery } from '@tanstack/react-query'
import { parseAbiItem } from 'viem'

// 배포 시점 블록 번호
const DEPLOY_BLOCK = 9797112n

export function useUserNFTs() {
    const { address } = useAccount()
    const publicClient = usePublicClient()

    return useQuery({
        queryKey: ['user-nfts', address],
        queryFn: async () => {
            if (!publicClient || !address) return []

            // 1) Transfer 이벤트 조회
            const logs = await publicClient.getLogs({
                address: nftContractAddress as `0x${string}`,
                event: parseAbiItem(
                    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
                ),
                args: { to: address },
                fromBlock: DEPLOY_BLOCK,
                toBlock: 'latest'
            })

            const tokenIds = logs.map((log: any) => log.args.tokenId)
            const uniqueTokenIds = [...new Set(tokenIds)]

            if (uniqueTokenIds.length === 0) return []

            // 2) multicall → ownerOf 확인
            const results = await publicClient.multicall({
                contracts: uniqueTokenIds.map((tokenId) => ({
                    address: nftContractAddress as `0x${string}`,
                    abi: nftAbi as any,        // ← 타입 문제 해결 핵심
                    functionName: 'ownerOf',
                    args: [tokenId]
                })),
                allowFailure: true
            })

            const owned: bigint[] = []

            results.forEach((res, i) => {
                if (res.status === 'success') {
                    const owner = String(res.result).toLowerCase()
                    if (owner === address.toLowerCase()) {
                        owned.push(uniqueTokenIds[i])
                    }
                }
            })

            return owned
        },
        enabled: !!address && !!publicClient
    })
}

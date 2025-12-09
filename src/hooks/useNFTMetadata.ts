import { useReadContract } from 'wagmi'
import { nftContractAddress } from '@/lib/constants'
import nftAbi from '@/lib/nftAbi.json'
import { useQuery } from '@tanstack/react-query'
import { resolveIpfs } from '@/lib/web3-utils'

export function useNFTMetadata(tokenId: bigint) {
    const { data: tokenURI } = useReadContract({
        address: nftContractAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'tokenURI',
        args: [tokenId],
    })

    return useQuery({
        queryKey: ['nft-metadata', tokenId.toString(), tokenURI],
        queryFn: async () => {
            if (!tokenURI) return null
            const url = resolveIpfs(tokenURI as string)
            const res = await fetch(url)
            const data = await res.json()
            return {
                name: data.name,
                image: resolveIpfs(data.image),
                description: data.description,
            }
        },
        enabled: !!tokenURI,
    })
}

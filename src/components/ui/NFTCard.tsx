'use client'

import { useState } from 'react'
import { useNFTMetadata } from '@/hooks/useNFTMetadata'
import { formatEther } from '@/lib/web3-utils'
import { 
    useAccount, 
    useReadContract, 
    useWriteContract, 
    useWaitForTransactionReceipt 
} from 'wagmi'
import { useRouter } from 'next/navigation'

import marketplaceAbi from '@/lib/marketplaceAbi.json'
import nftAbi from '@/lib/nftAbi.json'
import { marketplaceContractAddress, nftContractAddress } from '@/lib/constants'
import { parseUnits } from 'viem'

interface NFTCardProps {
    tokenId: bigint
    price?: bigint
    seller?: string
    isListed?: boolean
}

export function NFTCard({ tokenId, price, seller, isListed }: NFTCardProps) {
    const router = useRouter()
    const { data: metadata, isLoading } = useNFTMetadata(tokenId)
    const { address } = useAccount()

    const { writeContract, data: hash, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    const [isListing, setIsListing] = useState(false)
    const [listPrice, setListPrice] = useState('')

    const isOwner = seller?.toLowerCase() === address?.toLowerCase()

    // -----------------------------------------------------------------
    // NFT Approve 여부 체크
    // -----------------------------------------------------------------
    const { data: nftApproved } = useReadContract({
        address: nftContractAddress as `0x${string}`,
        abi: nftAbi,
        functionName: 'getApproved',
        args: [tokenId],
        query: { enabled: !!address },
    })

    const alreadyApproved =
        typeof nftApproved === 'string' &&
        nftApproved.toLowerCase() === marketplaceContractAddress.toLowerCase()

    // -----------------------------------------------------------------
    // Approve NFT
    // -----------------------------------------------------------------
    const handleApproveNFT = () => {
        writeContract({
            address: nftContractAddress as `0x${string}`,
            abi: nftAbi,
            functionName: 'approve',
            args: [marketplaceContractAddress, tokenId],
        })
    }

    // -----------------------------------------------------------------
    // List Action
    // -----------------------------------------------------------------
    const handleListAction = () => {
        if (!listPrice) return
        const priceWei = parseUnits(listPrice, 18)

        writeContract({
            address: marketplaceContractAddress as `0x${string}`,
            abi: marketplaceAbi,
            functionName: 'listItem',
            args: [tokenId, priceWei],
        })
    }

    // -----------------------------------------------------------------
    // Buy
    // -----------------------------------------------------------------
    const handleBuy = () => {
        if (!price) return

        writeContract({
            address: marketplaceContractAddress as `0x${string}`,
            abi: marketplaceAbi,
            functionName: 'buyItem',
            args: [tokenId],
        })
    }

    // -----------------------------------------------------------------
    // Cancel Listing
    // -----------------------------------------------------------------
    const handleCancel = () => {
        writeContract({
            address: marketplaceContractAddress as `0x${string}`,
            abi: marketplaceAbi,
            functionName: 'cancelListing',
            args: [tokenId],
        })
    }

    // -----------------------------------------------------------------
    // 🔥 트랜잭션 성공 시 자동 새로고침
    // -----------------------------------------------------------------
    if (isSuccess) {
        setTimeout(() => {
            router.refresh()     // Next.js App Router에서 새로고침
        }, 1200)
    }

    // -----------------------------------------------------------------
    // UI
    // -----------------------------------------------------------------
    if (isLoading) {
        return <div className="border rounded-lg p-4 h-80 animate-pulse bg-gray-100 dark:bg-gray-800"></div>
    }

    return (
        <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white dark:bg-gray-900 dark:border-gray-700">

            {/* 이미지 */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                {metadata?.image ? (
                    <img src={metadata.image} alt="" className="object-cover w-full h-full" />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                )}
            </div>

            <div className="p-4">
                <h3 className="font-bold text-lg">{metadata?.name || `NFT #${tokenId}`}</h3>
                <p className="text-sm text-gray-500 mb-4">ID: {tokenId.toString()}</p>

                {isListed && price && (
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-500">Price</span>
                        <span className="font-bold text-lg">{formatEther(price)} MTK</span>
                    </div>
                )}

                <div className="space-y-2">

                    {/* 구매 */}
                    {isListed && !isOwner && (
                        <button
                            onClick={handleBuy}
                            disabled={isPending || isConfirming}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isPending || isConfirming ? 'Processing…' : 'Buy Now'}
                        </button>
                    )}

                    {/* 취소 */}
                    {isListed && isOwner && (
                        <button
                            onClick={handleCancel}
                            disabled={isPending || isConfirming}
                            className="w-full py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                        >
                            {isPending || isConfirming ? 'Processing…' : 'Cancel Listing'}
                        </button>
                    )}

                    {/* 판매 UI */}
                    {!isListed && isOwner && (
                        <div className="space-y-2">
                            {!isListing ? (
                                <button
                                    onClick={() => setIsListing(true)}
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    List for Sale
                                </button>
                            ) : (
                                <div className="space-y-2">

                                    {/* NFT Approve */}
                                    {!alreadyApproved && (
                                        <button
                                            onClick={handleApproveNFT}
                                            disabled={isPending}
                                            className="w-full py-2 bg-gray-200 text-gray-800 rounded-lg"
                                        >
                                            Approve NFT
                                        </button>
                                    )}

                                    {/* 가격 입력 */}
                                    <input
                                        type="number"
                                        placeholder="Price in MTK"
                                        value={listPrice}
                                        onChange={(e) => setListPrice(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                                    />

                                    {/* List 버튼 */}
                                    <button
                                        onClick={handleListAction}
                                        disabled={isPending || !alreadyApproved}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        List
                                    </button>

                                    <button
                                        onClick={() => setIsListing(false)}
                                        className="w-full text-xs text-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {isSuccess && (
                        <div className="text-center text-green-600 text-sm mt-2">
                            Transaction Successful! Refreshing…
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

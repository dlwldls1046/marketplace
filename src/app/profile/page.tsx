'use client'

import { useState, useEffect } from 'react'
import { useUserNFTs } from '@/hooks/useUserNFTs'
import { NFTCard } from '@/components/ui/NFTCard'
import {
    useAccount,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt
} from 'wagmi'
import { tokenContractAddress, marketplaceContractAddress } from '@/lib/constants'
import tokenAbi from '@/lib/tokenAbi.json'
import { formatUnits } from 'viem'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    const { address, isConnected } = useAccount()
    const { data: nfts, isLoading: isNftsLoading } = useUserNFTs()

    // ------------------------------
    // Token Balance
    // ------------------------------
    const { data: tokenBalance } = useReadContract({
        address: tokenContractAddress,
        abi: tokenAbi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address }
    })

    const { data: decimals } = useReadContract({
        address: tokenContractAddress,
        abi: tokenAbi,
        functionName: 'decimals',
        query: { enabled: mounted }
    })

    const { data: symbolRaw } = useReadContract({
        address: tokenContractAddress,
        abi: tokenAbi,
        functionName: 'symbol',
        query: { enabled: mounted }
    })

    const symbol = typeof symbolRaw === 'string' ? symbolRaw : ''

    // ------------------------------
    // Claim 기능
    // ------------------------------
    const { data: hasClaimed } = useReadContract({
        address: tokenContractAddress,
        abi: tokenAbi,
        functionName: 'claimed',
        args: address ? [address] : undefined,
        query: { enabled: !!address }
    })

    const {
        writeContract: writeClaim,
        data: claimHash,
        isPending: isClaiming
    } = useWriteContract()

    const handleClaim = () => {
        writeClaim({
            address: tokenContractAddress,
            abi: tokenAbi,
            functionName: 'claim',
            args: []
        })
    }

    const { isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
        hash: claimHash
    })

    useEffect(() => {
        if (isClaimSuccess) {
            setTimeout(() => router.refresh(), 800)
        }
    }, [isClaimSuccess, router])

    // ------------------------------
    // Allowance
    // ------------------------------
    const { data: allowanceRaw } = useReadContract({
        address: tokenContractAddress,
        abi: tokenAbi,
        functionName: 'allowance',
        args: address ? [address, marketplaceContractAddress] : undefined,
        query: { enabled: !!address }
    })

    const allowance = typeof allowanceRaw === 'bigint' ? allowanceRaw : 0n

    const {
        writeContract: writeApprove,
        isPending: isApproving
    } = useWriteContract()

    const handleApprove = () => {
        writeApprove({
            address: tokenContractAddress,
            abi: tokenAbi,
            functionName: 'approve',
            args: [marketplaceContractAddress, BigInt(2 ** 256 - 1)]
        })
    }

    // ------------------------------
    // SSR 보호
    // ------------------------------
    if (!mounted) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold">Loading…</h1>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Please connect your wallet</h1>
            </div>
        )
    }

    // ------------------------------
    // Token formatting
    // ------------------------------
    const formattedTokenBalance =
        typeof tokenBalance === 'bigint' && typeof decimals === 'number'
            ? formatUnits(tokenBalance, decimals)
            : '0'

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>

            <div className="text-gray-600 dark:text-gray-400">
                <p className="mb-1">Address: {address}</p>

                <p>
                    Token Balance: {formattedTokenBalance} {symbol}
                </p>

                {/* Claim MTK */}
                <div className="mt-3">
                    {hasClaimed ? (
                        <p className="text-green-600 font-semibold">✔ You already claimed MTK</p>
                    ) : (
                        <button
                            onClick={handleClaim}
                            disabled={isClaiming}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg mt-2 hover:bg-purple-700 disabled:opacity-50"
                        >
                            {isClaiming ? 'Claiming…' : 'Claim Free MTK'}
                        </button>
                    )}
                </div>

                {/* Approve MTK */}
                <div className="mt-4">
                    {allowance > 0n ? (
                        <p className="text-green-600 font-semibold">✔ MTK Approved</p>
                    ) : (
                        <button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg mt-2 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isApproving ? 'Approving…' : 'Approve MTK'}
                        </button>
                    )}
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6 mt-10">My NFTs</h2>

            {isNftsLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            ) : nfts && nfts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {nfts.map((tokenId) => (
                        <NFTCard
                            key={tokenId.toString()}
                            tokenId={tokenId}
                            seller={address}
                            isListed={false}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-500 bg-gray-100 dark:bg-gray-900 rounded-lg">
                    You don't own any NFTs yet.
                </div>
            )}
        </div>
    )
}

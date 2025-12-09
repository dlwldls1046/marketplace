'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useReadContract,
} from 'wagmi'
import { formatAddress } from '@/lib/web3-utils'
import { formatEther, formatUnits } from 'viem'
import { tokenContractAddress } from '@/lib/constants'
import tokenAbi from '@/lib/tokenAbi.json'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const { data: ethBalance } = useBalance({ address })

  // MTK 잔액 읽기
  const { data: mtkBalance } = useReadContract({
    address: tokenContractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const handleConnect = () => {
    const connector = connectors[0]
    if (connector) connect({ connector })
  }

  const renderRight = () => {
    if (!ready) {
      return (
        <button
          onClick={handleConnect}
          className="px-6 py-2 
                    bg-indigo-600 text-white 
                    rounded-full shadow-md 
                    hover:bg-indigo-700 
                    transition-all duration-200"
        >
          Connect Wallet
        </button>
      )
    }

    if (isConnected) {
      return (
        <div className="flex items-center gap-6">

          {/* ETH 잔액 */}
          <div className="text-sm px-3 py-1 rounded-full bg-white/70 shadow-sm">
            <span className="font-semibold text-indigo-700">
              {ethBalance ? Number(formatEther(ethBalance.value)).toFixed(4) : '0.0000'}
            </span>{' '}
            ETH
          </div>

          {/* MTK 잔액 */}
          <div className="text-sm px-3 py-1 rounded-full bg-white/70 shadow-sm">
            <span className="font-semibold text-pink-600">
              {mtkBalance ? formatUnits(mtkBalance as bigint, 18) : '0'}
            </span>{' '}
            MTK
          </div>

          {/* 주소 */}
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-mono shadow-sm">
            {formatAddress(address)}
          </div>

          {/* Disconnect */}
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 text-sm 
                       text-red-500 
                       hover:text-red-600 
                       hover:bg-red-100 
                       rounded-full transition-all duration-200"
          >
            Disconnect
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={handleConnect}
        className="px-6 py-2 
                  bg-indigo-600 text-white 
                  rounded-full shadow-md 
                  hover:bg-indigo-700 
                  transition-all duration-200"
      >
        Connect Wallet
      </button>
    )
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 
                       border-b border-gray-200 dark:border-gray-800 
                       bg-gradient-to-r from-indigo-50 via-white to-pink-50 
                       backdrop-blur-sm shadow-sm">
      
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-extrabold text-indigo-700 tracking-tight">
          NFT Market
        </Link>

        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Marketplace</Link>
          <Link href="/mint" className="hover:text-indigo-600 transition-colors">Mint NFT</Link>
          <Link href="/profile" className="hover:text-indigo-600 transition-colors">My NFTs</Link>
        </nav>
      </div>

      <div>{renderRight()}</div>
    </header>
  )
}

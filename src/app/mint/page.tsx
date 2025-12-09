'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { nftContractAddress } from '@/lib/constants'
import nftAbi from '@/lib/nftAbi.json'
import { uploadFileToIPFS, uploadMetadataToIPFS } from '@/lib/ipfs'
import Image from 'next/image'

export default function MintPage() {
    const { address } = useAccount()
    const { writeContract, data: hash, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handleFile = (e: any) => {
        const f = e.target.files?.[0]
        if (f) {
            setFile(f)
            setPreview(URL.createObjectURL(f))
        }
    }

    const handleMint = async () => {
        if (!address) return alert("지갑을 연결해주세요.")
        if (!file || !name) return alert('이미지와 이름은 필수입니다.')

        setIsUploading(true)

        // 1) 이미지 업로드
        const imageCid = await uploadFileToIPFS(file)
        const imageURL = `ipfs://${imageCid}`

        // 2) 메타데이터 업로드
        const metadata = {
            name,
            description,
            image: imageURL,
        }

        const metadataCid = await uploadMetadataToIPFS(metadata)
        const tokenURI = `ipfs://${metadataCid}`

        setIsUploading(false)

        // 3) Mint 실행 — ★ 중요: MyNFT.sol은 mint(tokenURI) 하나만 받음!!
        writeContract({
    address: nftContractAddress,
    abi: nftAbi,
    functionName: 'mint',
    args: [tokenURI],
})

    }

    return (
        <div className="max-w-xl mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Mint New NFT</h1>

            <div className="space-y-4">
                <input type="file" accept="image/*" onChange={handleFile} className="block w-full" />

                {preview && (
                    <Image
                        src={preview}
                        alt="preview"
                        width={400}
                        height={400}
                        className="rounded-lg border"
                    />
                )}

                <input
                    type="text"
                    placeholder="NFT Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                />

                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                />

                <button
                    onClick={handleMint}
                    disabled={isPending || isConfirming || isUploading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {isUploading
                        ? 'Uploading to IPFS...'
                        : isPending || isConfirming
                        ? 'Minting...'
                        : 'Mint NFT'}
                </button>

                {isSuccess && <div className="text-green-500 text-center mt-4">🎉 NFT Mint 성공!</div>}
            </div>
        </div>
    )
}

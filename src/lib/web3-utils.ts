export function formatAddress(address: string | undefined): string {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function resolveIpfs(url?: string): string {
    if (!url) return '';

    const gateways = [
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/',
    ];

    if (url.startsWith('ipfs://')) {
        const cid = url.replace('ipfs://', '');
        return gateways[0] + cid; // 기본 게이트웨이
    }

    return url;
}


export function formatEther(wei: bigint | undefined): string {
    if (wei === undefined) return '0'
    // Simple formatting, for more precision use viem's formatEther
    const ether = Number(wei) / 1e18
    return ether.toFixed(4)
}

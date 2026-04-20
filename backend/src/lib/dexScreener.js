export async function fetchTokenTradeStats(tokenAddress) {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

  

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DexScreener error (status ${response.status}):`, errorText.slice(0, 500));
      return {
        trades24h: 0,
        buyers24h: 0,
        volume24h: 0,
        priceUsd: 0,
        fdv: 0,
        marketCapUsd: 0,
      };
    }

    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return {
        trades24h: 0,
        buyers24h: 0,
        volume24h: 0,
        priceUsd: 0,
        fdv: 0,
        marketCapUsd: 0,
      };
    }

    const bscPairs = data.pairs.filter(p => p.chainId === 'bsc');

    if (bscPairs.length === 0) {
      return {
        trades24h: 0,
        buyers24h: 0,
        volume24h: 0,
        priceUsd: 0,
        fdv: 0,
        marketCapUsd: 0,
      };
    }

    const primaryPair =
      bscPairs.find(p => p.baseToken?.address?.toLowerCase() === tokenAddress.toLowerCase()) ||
      bscPairs[0];

    let totalBuys = 0;
    let totalSells = 0;
    let totalVolume = 0;

    for (const pair of bscPairs) {
      totalBuys += pair.txns?.h24?.buys || 0;
      totalSells += pair.txns?.h24?.sells || 0;
      totalVolume += pair.volume?.h24 || 0;
    }

    return {
      trades24h: totalBuys + totalSells,
      buyers24h: totalBuys,
      volume24h: totalVolume,
      priceUsd: Number(primaryPair?.priceUsd) || 0,
      fdv: Number(primaryPair?.fdv) || 0,
      marketCapUsd: Number(primaryPair?.marketCap || primaryPair?.liquidity?.usd || 0),
    };
  } catch (error) {
    console.error(`DexScreener API error for ${tokenAddress}:`, error);
    return {
      trades24h: 0,
      buyers24h: 0,
      volume24h: 0,
      priceUsd: 0,
      fdv: 0,
      marketCapUsd: 0,
    };
  }
}

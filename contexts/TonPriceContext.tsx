import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TonPriceContextType {
  tonPrice: number | null;
  setTonPrice: (price: number | null) => void;
  convertUsdToTon: (usdAmount: number) => number | null;
}

const TonPriceContext = createContext<TonPriceContextType | undefined>(undefined);

export function TonPriceProvider({ children }: { children: ReactNode }) {
  const [tonPrice, setTonPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchTonPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
        const data = await response.json();
        setTonPrice(data['the-open-network'].usd);
      } catch (error) {
        console.error('Error fetching TON price:', error);
      }
    };

    fetchTonPrice();
    const interval = setInterval(fetchTonPrice, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const convertUsdToTon = (usdAmount: number): number | null => {
    if (!tonPrice) return null;
    return usdAmount / tonPrice;
  };

  return (
    <TonPriceContext.Provider value={{ tonPrice, setTonPrice, convertUsdToTon }}>
      {children}
    </TonPriceContext.Provider>
  );
}

export function useTonPrice() {
  const context = useContext(TonPriceContext);
  if (context === undefined) {
    throw new Error('useTonPrice must be used within a TonPriceProvider');
  }
  return context;
} 
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, toNano } from "@ton/core";
import TonWeb from "tonweb";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { User } from "lucide-react";

export default function FinanceTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [tonConnectUI] = useTonConnectUI();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleWalletConnection = useCallback((address: string) => {
    setTonWalletAddress(address);
    console.log("Wallet connected successfully!");
    setIsLoading(false);
  }, []);

  const handleWalletDisconnection = useCallback(() => {
    setTonWalletAddress(null);
    console.log("Wallet disconnected successfully!");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (tonConnectUI.account?.address) {
        handleWalletConnection(tonConnectUI.account.address);
      } else {
        handleWalletDisconnection();
      }
    };

    checkWalletConnection();

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        handleWalletConnection(wallet.account.address);
      } else {
        handleWalletDisconnection();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI, handleWalletConnection, handleWalletDisconnection]);

  const handleWalletAction = async () => {
    try {
      if (tonConnectUI.connected) {
        setIsLoading(true);
        await tonConnectUI.disconnect();
      } else {
        setIsLoading(true);
        await tonConnectUI.openModal();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
      console.error('Wallet connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    try {
      const tempAddress = Address.parse(address).toString();
      return `${tempAddress.slice(0, 4)}...${tempAddress.slice(-4)}`;
    } catch {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            {!tonWalletAddress ? (
              <>
                <h3 className="text-lg font-medium">Access to Finance</h3>
                <p className="text-gray-500 mb-4">To access your balance, please connect your TON wallet</p>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleWalletAction}
                  disabled={isLoading}
                >
                  <User className="h-4 w-4" />
                  {isLoading ? 'Connecting...' : 'Connect TON Wallet'}
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-4">Wallet Connected</h3>
                <p className="text-gray-500 mb-2">Address: {formatAddress(tonWalletAddress)}</p>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleWalletAction}
                  disabled={isLoading}
                >
                  <User className="h-4 w-4" />
                  {isLoading ? 'Disconnecting...' : 'Disconnect Wallet'}
                </Button>
              </>
            )}
            {error && (
              <p className="text-red-500 mt-4 text-sm">{error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
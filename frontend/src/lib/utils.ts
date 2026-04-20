import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(addr: string, left = 6, right = 4) {
  if (!addr || addr.length < 12) return addr
  return `${addr.slice(0, left)}…${addr.slice(-right)}`
}

export function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${Math.round(n).toLocaleString()}`
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return iso
  }
}

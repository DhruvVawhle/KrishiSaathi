import React from "react"
import { Phone } from "lucide-react"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from "@/frontend/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu"
import { useUser } from "@/frontend/contexts/UserContext"
import { cn } from "@/frontend/lib/utils"

/**
 * Helper to generate initials from names (English support)
 * For Hindi names, it uses the first character of each word.
 */
export function getInitials(name) {
  if (!name) return "??"
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * 1. FARMER AVATAR
 * Used in Farmer Dashboard with Online/Offline status
 */
export function FarmerAvatar({ name, photoUrl, isOnline, size = "default", className }) {
  return (
    <span aria-label={`${name}, Farmer (किसान)`}>
      <Avatar size={size} className={className}>
        <AvatarImage 
          src={photoUrl} 
          alt={`${name} की प्रोफाइल फोटो`} 
        />
        <AvatarFallback className="bg-[var(--avatar-fallback-bg)] text-[var(--avatar-fallback-text)]">
          {getInitials(name)}
        </AvatarFallback>
        {isOnline !== undefined && (
          <AvatarBadge
            className={isOnline ? "bg-[var(--avatar-badge-online)]" : "bg-[var(--avatar-badge-offline)]"}
          />
        )}
      </Avatar>
    </span>
  )
}

/**
 * 2. DEALER AVATAR
 * Used for Agri Dealers with Verified Badge
 */
export function DealerAvatar({ name, photoUrl, isVerified, size = "lg", className }) {
  return (
    <span aria-label={`${name}, Agri Dealer (डीलर)`}>
      <Avatar size={size} className={className}>
        <AvatarImage 
          src={photoUrl} 
          alt={`${name} - Dealer Profile`} 
        />
        <AvatarFallback className="bg-[var(--avatar-fallback-bg)] text-[var(--avatar-fallback-text)]">
          {getInitials(name)}
        </AvatarFallback>
        {isVerified && (
          <AvatarBadge className="bg-[var(--avatar-badge-verified)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full text-white p-0.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </AvatarBadge>
        )}
      </Avatar>
    </span>
  )
}

/**
 * 3. EXPERT AVATAR
 * Used for Krishi Mitras with Availability Badge + Icon
 */
export function ExpertAvatar({ name, photoUrl, available, size = "lg", className }) {
  return (
    <span aria-label={`${name}, Krishi Mitra (कृषि मित्र)`}>
      <Avatar size={size} className={className}>
        <AvatarImage 
          src={photoUrl} 
          alt={`${name} - Agri Expert`} 
        />
        <AvatarFallback className="bg-[var(--avatar-fallback-bg)] text-[var(--avatar-fallback-text)]">
          {getInitials(name)}
        </AvatarFallback>
        {available && (
          <AvatarBadge className="bg-[var(--avatar-badge-expert)] flex items-center justify-center">
            <Phone className="h-2.5 w-2.5 text-white" />
          </AvatarBadge>
        )}
      </Avatar>
    </span>
  )
}

/**
 * 4. FPO MEMBER GROUP
 * Show stacked members with overflow count
 */
export function FPOMemberGroup({ members = [], maxVisible = 4, size = "sm", className }) {
  const visible = members.slice(0, maxVisible)
  const overflow = members.length - maxVisible

  return (
    <AvatarGroup className={className}>
      {visible.map((m, i) => (
        <Avatar key={m.id || i} size={size}>
          <AvatarImage src={m.photoUrl} alt={m.name} />
          <AvatarFallback className="bg-[var(--avatar-fallback-bg)] text-[var(--avatar-fallback-text)]">
            {getInitials(m.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <AvatarGroupCount className="bg-[var(--color-bg-soft)] text-[var(--color-primary)]">
          +{overflow}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  )
}

/**
 * 5. NAV AVATAR
 * Navbar user avatar with Dropdown Menu
 */
export function NavAvatar() {
  const { user, handleLogout } = useUser()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer hover:ring-2 hover:ring-[var(--avatar-badge-online)] transition-all" size="default">
          <AvatarImage src={user.photoURL} alt={user.name} />
          <AvatarFallback className="bg-[var(--avatar-fallback-bg)] text-[var(--avatar-fallback-text)]">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border-[var(--color-bg-soft)]">
        <DropdownMenuLabel className="font-bold text-[var(--color-primary)]">{user.name}</DropdownMenuLabel>
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {user.role} {user.state ? `· ${user.state}` : ''}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer hover:bg-green-50">मेरी प्रोफाइल / My Profile</DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer hover:bg-green-50">सेटिंग्स / Settings</DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer hover:bg-green-50">e-Invoice इतिहास / Invoice History</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 cursor-pointer hover:bg-red-50" 
          onClick={handleLogout}
        >
          लॉग आउट / Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * 6. ADMIN AVATAR
 * Admin with Red Online Badge
 */
export function AdminAvatar({ name, isOnline, size = "default", className }) {
  return (
    <span aria-label={`${name}, Admin`}>
      <Avatar size={size} className={className}>
        <AvatarFallback className="bg-red-800 text-white font-bold">
          {getInitials(name)}
        </AvatarFallback>
        {isOnline && (
          <AvatarBadge className="bg-red-500" />
        )}
      </Avatar>
    </span>
  )
}

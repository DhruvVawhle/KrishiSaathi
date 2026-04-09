import React from "react"
import { motion } from "motion/react"
import { 
  FarmerAvatar, 
  ExpertAvatar, 
  FPOMemberGroup, 
  NavAvatar, 
  DealerAvatar,
  AdminAvatar 
} from "@/frontend/components/AvatarWrappers"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card"

const demoMembers = [
  { name: "Ramesh Sharma", photoUrl: "https://i.pravatar.cc/150?u=ramesh" },
  { name: "Suresh Patil", photoUrl: "https://i.pravatar.cc/150?u=suresh" },
  { name: "Ganesh Hegde", photoUrl: "https://i.pravatar.cc/150?u=ganesh" },
  { name: "Anita Desai", photoUrl: "https://i.pravatar.cc/150?u=anita" },
  { name: "Deepak Rao", photoUrl: "https://i.pravatar.cc/150?u=deepak" },
  { name: "Priya Singh", photoUrl: "https://i.pravatar.cc/150?u=priya" },
]

export default function AvatarDemo() {
  return (
    <div className="container mx-auto py-12 px-4 space-y-12 bg-[var(--color-bg)] min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-[var(--font-heading)] text-[var(--color-primary)] font-bold">
          Avatar Component System
        </h1>
        <p className="text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto">
          KrishiSaathi role-based profile components with Hindi support, status badges, and accessibility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* 1. Farmer Avatars */}
        <Card className="border-[var(--color-bg-soft)] shadow-md">
          <CardHeader>
            <CardTitle className="text-[var(--color-primary)]">किसान (Farmer)</CardTitle>
            <CardDescription>Default size, online/offline status</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <FarmerAvatar name="Ramesh Sharma" isOnline={true} />
              <span className="text-xs font-medium">Online</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <FarmerAvatar name="Suresh Patil" isOnline={false} />
              <span className="text-xs font-medium text-gray-500">Offline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <FarmerAvatar name="नाम" />
              <span className="text-xs font-medium">Initials</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Dealer Avatars */}
        <Card className="border-[var(--color-bg-soft)] shadow-md">
          <CardHeader>
            <CardTitle className="text-[var(--color-primary)]">डीलर (Agri Dealer)</CardTitle>
            <CardDescription>Size: lg, with verification badge</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <DealerAvatar name="Krishi Agro" isVerified={true} />
              <span className="text-xs font-medium text-blue-600">Verified</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <DealerAvatar name="Kisan Seeds" isVerified={false} />
              <span className="text-xs font-medium text-gray-400">Standard</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Expert Avatars */}
        <Card className="border-[var(--color-bg-soft)] shadow-md">
          <CardHeader>
            <CardTitle className="text-[var(--color-primary)]">कृषि मित्र (Expert)</CardTitle>
            <CardDescription>Size: lg, availability phone icon</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <ExpertAvatar name="Dr. Mehta" available={true} />
              <span className="text-xs font-medium text-purple-600">Available</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ExpertAvatar name="Sanjay Rao" available={false} />
              <span className="text-xs font-medium text-gray-400">Busy</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. FPO Group */}
        <Card className="col-span-1 md:col-span-2 border-[var(--color-bg-soft)] shadow-md">
          <CardHeader>
            <CardTitle className="text-[var(--color-primary)]">FPO Member Group</CardTitle>
            <CardDescription>Stacked layout with overflow count</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-8">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Small Size (FPO Default - sm)</p>
              <FPOMemberGroup members={demoMembers} maxVisible={4} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Regular Size (Avatar Default)</p>
              <FPOMemberGroup members={demoMembers} maxVisible={3} size="default" />
            </div>
          </CardContent>
        </Card>

        {/* 5. Nav & Admin */}
        <Card className="border-[var(--color-bg-soft)] shadow-md">
          <CardHeader>
            <CardTitle className="text-[var(--color-primary)]">Platform Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <span className="text-sm font-medium">Header Profile</span>
              <NavAvatar />
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <AdminAvatar name="System Admin" isOnline={true} size="sm" />
                <span className="text-sm font-medium">Table Admin</span>
              </div>
              <span className="text-xs text-red-600 font-bold uppercase">Superuser</span>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="bg-white p-8 rounded-3xl border border-[var(--color-bg-soft)] shadow-lg space-y-6">
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">Accessibility & Language (हिंदी)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text)]">
              All avatars include <code>aria-label</code> with role-specific descriptions and name.
              Fallback initials are generated from the name property.
            </p>
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
              <FarmerAvatar name="रमेश शर्मा" />
              <div>
                <p className="text-sm font-bold">रमेश शर्मा (Ramesh Sharma)</p>
                <p className="text-xs text-muted-foreground">Initials generated from Hindi characters</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text)]">
              Custom CSS variables are used for theming, ensuring brand consistency across Light and Dark modes.
            </p>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--avatar-fallback-bg)]" title="Agri Green" />
              <div className="w-8 h-8 rounded-full bg-[var(--avatar-badge-online)]" title="Online" />
              <div className="w-8 h-8 rounded-full bg-[var(--avatar-badge-verified)]" title="Verified" />
              <div className="w-8 h-8 rounded-full bg-[var(--avatar-badge-expert)]" title="Expert" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

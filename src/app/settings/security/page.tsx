'use client';

import { UserSecuritySettings } from '@/components/user-security-settings';

export default function SecuritySettingsPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Sécurité du Compte</h1>
            <UserSecuritySettings />
        </div>
    );
}

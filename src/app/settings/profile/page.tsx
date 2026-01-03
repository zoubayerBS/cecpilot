import { Metadata } from "next";
import { UserProfileSettings } from "@/components/user-profile-settings";

export const metadata: Metadata = {
    title: "Mon Profil | CEC Pilot",
    description: "Gérez vos informations personnelles",
};

export default function ProfilePage() {
    return (
        <div className="container max-w-4xl py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                    Paramètres du Compte
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Personnalisez votre expérience et sécurisez vos accès.
                </p>
            </div>

            <UserProfileSettings />
        </div>
    );
}

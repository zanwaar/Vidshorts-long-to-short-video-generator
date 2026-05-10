import { SignUp } from "@clerk/nextjs";

import AuthShell from "@/components/AuthShell";
import { clerkAppearance } from "@/lib/clerk-theme";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Create your workspace"
      title="Start turning long videos into publishable shorts."
      description="Set up your ViralClip AI account to upload recordings, review highlight candidates, and unlock your dashboard workflow."
    >
      <SignUp
        appearance={clerkAppearance}
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}

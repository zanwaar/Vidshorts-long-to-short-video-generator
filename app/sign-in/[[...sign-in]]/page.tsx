import { SignIn } from "@clerk/nextjs";

import AuthShell from "@/components/AuthShell";
import { clerkAppearance } from "@/lib/clerk-theme";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to keep your short-form pipeline moving."
      description="Access your uploads, shortlisted clips, and rendering queue from one dark workspace built for repeatable content production."
    >
      <SignIn
        appearance={clerkAppearance}
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
      />
    </AuthShell>
  );
}

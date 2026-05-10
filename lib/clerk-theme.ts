export const clerkAppearance = {
  variables: {
    colorPrimary: "#b07cff",
    colorBackground: "#0f1425",
    colorText: "#f5f7ff",
    colorTextSecondary: "#aab5d5",
    colorInputBackground: "rgba(255,255,255,0.06)",
    colorInputText: "#f5f7ff",
    colorDanger: "#ff6b7a",
    borderRadius: "1rem",
  },
  elements: {
    card: "border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl",
    headerTitle: "text-white text-3xl font-semibold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton:
      "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
    socialButtonsBlockButtonText: "text-white",
    dividerLine: "bg-white/10",
    dividerText: "text-white/45",
    formFieldLabel: "text-white/80",
    formFieldInput:
      "h-11 rounded-2xl border border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus:border-primary/60 focus:ring-2 focus:ring-primary/20",
    formButtonPrimary:
      "h-11 rounded-full border border-primary/40 bg-primary text-primary-foreground shadow-[0_16px_40px_rgba(125,92,255,0.35)] hover:bg-primary/90",
    footerActionText: "text-muted-foreground",
    footerActionLink: "text-primary hover:text-primary/85",
    formResendCodeLink: "text-primary hover:text-primary/85",
    identityPreviewText: "text-white",
    formFieldSuccessText: "text-emerald-300",
    formFieldErrorText: "text-rose-300",
    otpCodeFieldInput:
      "rounded-2xl border border-white/10 bg-white/[0.04] text-white",
    navbar: "hidden",
    pageScrollBox: "px-0 py-0",
    page: "w-full",
  },
};

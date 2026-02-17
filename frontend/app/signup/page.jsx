import { SignupForm } from "@/components/signup-form";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center p-6 md:p-24">
      <h1 className="text-2xl md:text-4xl m-4 md:m-8">Sign Up to Continue</h1>
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <SignUp />
    </div>
  );
}

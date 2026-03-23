import Image from "next/image";
import Button from "@/components/Button/Button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#ff8f4a] via-[#f97316] to-[#c2410c]">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
        <div className="flex flex-row items-center justify-center gap-4 sm:gap-5">
          <Image
            src="/home/logo-white.png"
            alt=""
            width={72}
            height={72}
            className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] object-contain"
            priority
          />
          <Image
            src="/home/bookmatch-white.png"
            alt="Bookmatch."
            width={280}
            height={56}
            className="h-12 w-auto sm:h-14 object-contain object-left"
            priority
          />
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 px-8 pb-10 sm:pb-12 w-full max-w-sm mx-auto">
        <Button
          Title="CREATE ACCOUNT"
          Link
          URL="/pages/signup"
          Fill
          Color="cream"
        />
        <Button
          Title="SIGN IN"
          Link
          URL="/pages/login"
          Fill={false}
          Color="white"
        />
      </div>
    </div>
  );
}

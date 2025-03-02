import Link from "next/link";

export default function Home() {
  return (
    <main className=" h-screen w-screen flex p-3  gap-3">
    <div className="flex-1 bg-blue-50 rounded-md flex items-center justify-center">
      <img src={'/assets/logo.svg'} alt="" className="w-[300px]" />
    </div>
    <div className="flex-1 flex  flex-col">
    <Link href={'/sign-up'} className="flex-1 flex items-center justify-center hover:bg-green-50">
      <span className="font-bold text-xl">Get started</span>
    </Link>
    <Link href={'/sign-in'} className="flex-1 flex items-center justify-center hover:bg-green-50" prefetch>
      <span className="font-bold text-xl">Sign in</span>
    </Link>
    </div>
    
   
    </main>
  );
}

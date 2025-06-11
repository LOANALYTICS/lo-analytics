import Link from "next/link";

export default function Home() {
  return (
    <main className=" h-screen w-screen flex flex-col p-3 items-center justify-center  gap-3">
      <nav className="fixed top-8 flex justify-between px-16 w-full items-end ">
      <img src={'/assets/logo.svg'} alt="" className="w-12 h-12 " />
      <div className="flex gap-3 ml-8 ">
      <Link href={'/support'} className="py-2 h-fit px-8  flex items-center justify-center hover:bg-green-50 rounded-full transition-all duration-300" prefetch>
      <span className="text-base">Contact</span>
      </Link>
      <Link href={'/sign-in'} className="py-2 h-fit px-8  flex items-center justify-center bg-blue-300 text-white hover:text-black/50 hover:bg-green-50  rounded-full transition-all duration-300" prefetch>
      <span className="text-base">Sign in</span>
    </Link>

      </div>
      </nav>
    <div className="text-center max-w-4xl">
    <h1 className="text-5xl font-extrabold"> <span className="bg-gradient-to-tr from-blue-300 text-transparent bg-clip-text to-blue-500 ">LOSO</span> ANALYTICS</h1>
    <p className="mt-3 font-medium text-neutral-700">Advanced tools to assess Course Learning Outcomes (CLOs), Program Learning Outcomes (PLOs), and Student Outcomes (SOs). Perform KR20 Analysis and categorize questions by difficulty, from very easy to very difficult. Optimize educational outcomes today!</p>
   
    </div>
    <div className="flex gap-12">
    <Link href={'/sign-up'} className="py-2 px-8 flex items-center justify-center bg-blue-300 text-white hover:text-black/50 hover:-rotate-3 transition-all duration-300 rounded-full hover:bg-green-100">
      <span className="font-semibold text-lg">Get started</span>
    </Link>
    
    </div>
    
   
    </main>
  );
}

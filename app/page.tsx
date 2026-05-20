import Image from "next/image";
import SearchForm from "@/components/SearchForm";

export default function HomePage() {
  return (
    <div className="px-8">
      <main className="flex min-h-screen flex-col items-center justify-center py-16">
        <h1 className="mb-2 text-center text-[1.8rem] font-bold md:text-[2rem]">
          🛳️ Debby&apos;s Parcel Tracking App
        </h1>
        <SearchForm />
      </main>

      <footer className="flex flex-1 items-center justify-center border-t border-[#eaeaea] py-8">
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-grow items-center justify-center"
        >
          Powered by{" "}
          <span className="ml-2 inline-flex h-[1em] items-center">
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Footer() {
  return (
    <>
      <footer
        className={`${inter.className} bg-neutral-50 w-full border-t border-neutral-200 pt-10 pb-4 text-neutral-700 px-5`}
      >
        <div className="ctx-container">
          <div className="wrapper grid grid-cols-1 md:grid-cols-2 gap-8 items-start pb-6">
            {/* Left: Logo and description */}
            <div className="flex flex-col gap-3 items-start">
              <img src="wta.svg" alt="" className="saturate-0 w-[200px]" />
              <p className="text-sm max-w-xs mt-2 max-[800px]:text-xs">
                AI-powered travel planning, personalized for every journey.
                Discover, plan, and explore with confidence.
              </p>
            </div>
            {/* Right: Navigation links */}
            <div className="flex flex-col gap-2 md:items-end items-start">
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold mb-1">Contact Us</span>
                <a
                  href="mailto:hello@whereshouldivacation.com"
                  className="hover:text-orange-600 transition"
                >
                  hello@whereshouldivacation.com
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* Attribution section */}
        <div className="ctx-container mt-6 border-t border-neutral-200 pt-4 text-xs text-neutral-500 flex flex-col justify-between items-center gap-2">
          <div className="wrapper flex justify-between items-center">
            <span className=" max-[800px]:text-xs">
              &copy; {new Date().getFullYear()} Where Should I Vacation. All
              rights reserved.
            </span>
            <span className="text-right max-[800px]:text-xs">
              Developed by CTX Softwares Philippines.
            </span>
          </div>
          <div className="wrapper flex saturate-0 items-center gap-3 mt-10">
            <div className="attrib">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1024px-OpenAI_Logo.svg.png"
                alt="OpenAI"
                className="w-[100px]"
              />
            </div>
            <div className="attrib">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google-cloud-platform.svg"
                alt="GCP"
                className="w-[100px] h-[50px]"
              />
            </div>
            {/* <div className="attrib">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Amadeus_%28CRS%29_Logo.svg/1200px-Amadeus_%28CRS%29_Logo.svg.png"
                alt="Amadeus"
                className="w-[100px]"
              />
            </div> */}
            <div className="attrib">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Aviasales_logo.png/1024px-Aviasales_logo.png"
                alt="Aviasales"
                className="w-[100px]"
              />
            </div>
            {/* <div className="attrib">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Kayak_Logo.svg/2560px-Kayak_Logo.svg.png"
                alt="Kayak.com"
                className="w-[100px]"
              />
            </div> */}
            {/* <div className="attrib">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3b/Expedia_Logo_2023.svg"
                alt="Expedia"
                className="w-[100px]"
              /> */}
            {/* </div>
            <div className="attrib">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Agoda_transparent_logo.png"
                alt="Agoda"
                className="w-[100px]"
              />
            </div> */}
          </div>
        </div>
      </footer>
    </>
  );
}

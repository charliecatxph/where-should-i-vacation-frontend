import Link from "next/link";

export default function ItineraryAd() {
  return (
    <>
      <section className="itineraries pb-25 pt-5">
        <div className="ctx-container">
          <div className="wrapper mt-25 flex px-5  max-[700px]:flex-col-reverse max-[700px]:gap-20">
            <div className="basis-1/2">
              <h1 className="text-4xl font-[800] mb-2 tracking-tight text-orange-600 max-[800px]:text-2xl">
                Everything’s Better with Itineraries
              </h1>
              <p className="text-gray-700 mb-1">
                Winging it sounds fun... til' you waste hours deciding what to
                do. A solid itinerary turns "What now?" into "Let’s go!"
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-5">
                <li>🗺️ No more backtracking — explore smarter, not harder.</li>
                <li>
                  ✅ Skip decision fatigue — your day’s already mapped out.
                </li>
                <li>
                  🍜 Enjoy handpicked experiences that actually match your vibe.
                </li>
                <li>🎯 Hit key highlights without wasting time Googling.</li>
                <li>
                  🧘‍♂️ Balance structure with spontaneity — just how you like it.
                </li>
              </ul>
              <p className="font-[500] mt-3">
                We don’t just build plans — we build{" "}
                <span className="font-bold text-orange-600">your</span> kind of
                vacation. Whether you're into chill days, adrenaline kicks,
                hidden gems, or something totally different — we craft your
                itinerary around{" "}
                <span className="font-bold text-orange-600">you</span>. All you
                have to do is show up.
              </p>
              <Link href="/itinerary-builder">
                <button className="mt-6 bg-orange-600 hover:bg-orange-500  text-white py-2 px-8 rounded-lg shadow transition-colors duration-200">
                  <span className="font-[700]">Create An Itinerary</span>
                </button>
              </Link>
            </div>
            <div className="basis-1/2">
              <div className="flex justify-center items-center h-full relative">
                <img
                  src="/itinerary-ex.png"
                  alt="Itinerary Example"
                  style={{
                    width: "90%",
                    maxWidth: "320px",
                    transform:
                      "perspective(700px) rotateY(-16deg) rotateX(8deg) scale(0.98)",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {/* Chat head */}
                <div
                  style={{
                    position: "absolute",
                    left: "10%",
                    bottom: "-10%",
                    zIndex: 2,
                    minWidth: "210px",
                    background: "white",
                    boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
                    borderRadius: "1.5rem",
                    padding: "1.1rem 1.3rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.7rem",
                  }}
                >
                  <div className="flex flex-col gap-2 max-[600px]:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 min-w-[56px]">
                        What
                      </span>
                      <span className="text-sm font-[400] text-gray-800">
                        photography... budget trip if possible.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 min-w-[56px]">
                        Where
                      </span>
                      <span className="text-sm font-[400] text-gray-800">
                        Tokyo, Japan
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 min-w-[56px]">
                        When
                      </span>
                      <span className="text-sm font-[400] text-gray-800">
                        May 12 - May 18
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-800 min-w-[56px] mt-1">
                        Prefer
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          Adventure
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                        >
                          All
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                        >
                          Foodie
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium"
                        >
                          Culture
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

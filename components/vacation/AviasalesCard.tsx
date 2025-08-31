export default function AviasalesCard() {
  return (
    <>
      <section className="">
        <div className="ctx-container">
          <div className="wrapper mt-5">
            <div className="flex items-center  gap-5 aviasales-cta bg-gradient-to-br from-blue-800 to-blue-600 rounded-xl px-8 py-10 shadow-xl shadow-blue-200 max-[700px]:flex-col">
              <div className="h-full w-1/2 max-[700px]:w-full">
                <h1 className="text-4xl font-[800] text-white mb-2 tracking-tight max-[800px]:text-2xl">
                  Book Your Flights with Aviasales
                </h1>
                <p className="font-[500] text-blue-50  text-lg leading-relaxed max-[800px]:text-base">
                  Fly farther for less. Aviasales scans the skies to find you
                  unbeatable airfare deals—it's like having a personal flight
                  expert at your fingertips.
                </p>
                <a
                  target="_blank"
                  href="https://tp.media/click?shmarker=665905&promo_id=5457&source_type=link&type=click&campaign_id=100&trs=450110"
                >
                  <button className="bg-white px-8 py-2 rounded-lg mt-5 ">
                    <span className="font-[500]">Book your flight now</span>
                  </button>
                </a>
              </div>
              <div className="h-full w-1/2 text-white flex items-center  max-[700px]:w-full">
                <div className="bg-neutral-50/20 border-1 border-blue-500 h-full w-full flex flex-col justify-center items-center rounded-xl p-6">
                  <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold ">Save up to</h1>
                    <p className="text-5xl font-extrabold text-yellow-300">
                      60%
                    </p>
                    <p className="">on flight bookings</p>
                  </div>
                  <div className="text-center border-t-1 w-full pt-5 border-blue-300">
                    <p className="">Average savings per booking</p>
                    <p className="text-2xl font-bold">$340</p>
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

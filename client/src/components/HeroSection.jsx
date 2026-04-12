import { FiSearch } from "react-icons/fi";

const HeroSection = () => {
    return (
        <section className="flex min-h-[calc(100vh-74px)] flex-col bg-[#f5f7fb]">
            <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-6 pt-10 sm:px-10 lg:pt-14">
                <div className="grid flex-1 grid-cols-1 items-center gap-8 pb-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <h1 className="max-w-[620px] text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                            GrievanceHub: The Seamless Search Seamless Voice of Citizens
                        </h1>
                        <div className="mt-8 flex w-full max-w-[520px] items-center rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm">
                            <input
                                type="text"
                                placeholder="Find or report issues"
                                className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                            />
                            <button className="ml-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#2f8db5] text-white transition hover:bg-[#267b9f]">
                                <FiSearch className="text-lg" />
                            </button>
                        </div>
                    </div>

                    <div className="relative flex justify-center lg:justify-end">
                        <div className="absolute -left-6 bottom-2 h-28 w-28 rounded-full bg-[#dfeaf8]" />
                        <img
                            src="/images/bg10.png"
                            alt="Citizen grievance support"
                            className="relative z-10 w-full max-w-[500px] rounded-2xl object-contain"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-200 bg-white">
                <div className="mx-auto max-w-[1200px] px-6 py-8 sm:px-10">
                    <h2 className="text-center text-3xl font-semibold text-slate-900">Quick links</h2>
                    <div className="mt-5 grid grid-cols-1 gap-4 text-center text-lg font-medium text-slate-800 sm:grid-cols-3">
                        <a href="/status" className="hover:text-teal-700">Track an existing issue</a>
                        <a href="/complaints" className="hover:text-teal-700">How to file</a>
                        <a href="/how-it-works" className="hover:text-teal-700">Our Impact</a>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-200 bg-[#f3f4f8]">
                <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 px-6 py-6 text-sm text-slate-600 sm:grid-cols-3 sm:px-10">
                    <div>
                        <p className="font-semibold text-slate-800">Gevinabto</p>
                        <p>NagrikConnect AI</p>
                        <p className="mt-1 text-xs">@ 2026 - All Government inc.</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Footer</p>
                        <p>Contact</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">Corners</p>
                        <p>Contact Us</p>
                        <p>Privacy Policy</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
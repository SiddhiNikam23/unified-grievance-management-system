export default function LandingPage() {
    return(
        <div className="bg-gray-100 font-sans">
      {}
      <header className="bg-green-900 text-white p-4 flex justify-between items-center">
        <div className="text-xl font-bold">Mayorx</div>
        <nav className="space-x-6">
          <a href="#" className="hover:underline">Home</a>
          <a href="#" className="hover:underline">Services</a>
          <a href="#" className="hover:underline">Pages</a>
          <a href="#" className="hover:underline">News</a>
          <a href="#" className="hover:underline">Contact</a>
        </nav>
        <button className="bg-orange-500 px-4 py-2 rounded">Submit Tasks</button>
      </header>
      {}
      <section
        className="bg-cover bg-center h-96 flex items-center justify-center text-white"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200')" }}
        >
        <h1 className="text-5xl font-bold">Department</h1>
      </section>
      {}
      <section className="text-center py-16">
        <h2 className="text-2xl font-bold mb-8">The growth of the richest city of all time</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 shadow-lg rounded">
            <img src="https://via.placeholder.com/300" alt="City 1" />
            <p>The proof of the richest city of all time</p>
          </div>
          <div className="bg-white p-4 shadow-lg rounded">
            <img src="https://via.placeholder.com/300" alt="City 2" />
            <p>City highlights include all attractions</p>
          </div>
          <div className="bg-white p-4 shadow-lg rounded">
            <img src="https://via.placeholder.com/300" alt="City 3" />
            <p>The growth of the richest city of all time</p>
          </div>
        </div>
      </section>
      {}
      <section className="bg-green-800 text-white py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Together, We Will Move Country Forward</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <h3 className="text-xl font-bold">Your Government</h3>
            <p>Learn more</p>
          </div>
          <div>
            <h3 className="text-xl font-bold">Road & Transportation</h3>
            <p>Explore options</p>
          </div>
          <div>
            <h3 className="text-xl font-bold">Jobs & Unemployment</h3>
            <p>Read more</p>
          </div>
          <div>
            <h3 className="text-xl font-bold">Arts & Culture</h3>
            <p>Check out</p>
          </div>
        </div>
      </section>
      {}
      <section className="py-16 text-center">
        <h2 className="text-2xl font-bold mb-8">Explore Online Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 shadow-lg rounded">Building Permits</div>
          <div className="bg-white p-4 shadow-lg rounded">Parking Permits</div>
          <div className="bg-white p-4 shadow-lg rounded">Tax Permits</div>
          <div className="bg-white p-4 shadow-lg rounded">Apply City Job</div>
          <div className="bg-white p-4 shadow-lg rounded">Planning Documents</div>
          <div className="bg-white p-4 shadow-lg rounded">Report Issues</div>
        </div>
      </section>
      {}
      <footer className="bg-green-900 text-white p-8">
        <div className="text-center">
          <p>Address: Main Square Road, Region 12</p>
          <p>Contact: contact@mayorx.gov</p>
          <p>Clock: Open 9:00 AM - Close 6:00 PM</p>
        </div>
      </footer>
    </div>
);
}

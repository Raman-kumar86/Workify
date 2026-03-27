const ImageSection = () => {
  return (
    <>
      <div
        className="hidden md:flex w-3/5 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d')",
        }}
      >
        <div className="bg-black/60 flex flex-col justify-center items-center text-white p-10">
          <h1 className="text-5xl font-bold mb-4">Uber Labour</h1>
          <p className="text-xl text-center max-w-md">
            Find trusted workers or get hired for your skills — all in one
            place.
          </p>
        </div>
      </div>
    </>
  );
};
export default ImageSection;

const Home = () => {
    return (
          <>
              <div className="flex justify-center pt-6">
                  <a href='/signup'>
                      <button className="bg-blue-700 text-white rounded-xl py-2 px-4 mr-4">Sign up</button>
                  </a>
  
                  <a href='/signin'>
                      <button className="bg-blue-700 text-white rounded-xl py-2 px-4">Sign in</button>
                  </a>
              </div>
  
              <div className='pt-44'>
                  <h1 className='text-center text-4xl font-bold'>Homepage</h1>
              </div>
          </>
      );
  }
  
  export default Home
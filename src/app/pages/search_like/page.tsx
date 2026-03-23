"use client";

import { useState } from 'react';
// import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import Search from "@/components/Search/Search";
import Content from "@/components/Content/Content";
import BookGrid from "@/components/BookGrid/BookGrid";

const Fav = () => {
  const [books, setBooks] = useState<Map<string, string>>(new Map<string, string>());
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchResults = (results: Map<string, string>) => {
      setBooks(results);
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Header />
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full"> {/* Added w-full */}
        <div className="w-full max-w-4xl mx-auto"> {/* Added container with width constraints */}
          <Content 
            Title={"Search"} 
            Information1={"Enter the title of a book you enjoyed."} 
            Information2={"Heart it. <3"}
          />
        </div>
        <Search onSearchResults={handleSearchResults} />
        <BookGrid 
          books={books}
          isLoading={isLoading}
        />
      </main>
      {/* <Footer /> */}
    </div>
  );
};

export default Fav;
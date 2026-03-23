'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FaSearch } from "react-icons/fa";
import { fetchTopBooks } from '../../utils/searchUtils';
import "./Search.css";

interface SearchProps {
    onSearchResults: (results: Map<string, string>) => void;
}

const Search = ({ onSearchResults }: SearchProps) => {
  const searchText = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    let tempSearchTerm = searchText.current?.value.trim() ?? "";
    if ((tempSearchTerm.replace(/[^\w\s]/gi,"")).length === 0) {
      tempSearchTerm = "the lost world";
    }

    const results = await fetchTopBooks(tempSearchTerm);
    onSearchResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (searchText.current) {
        searchText.current.focus();
    }
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="search-container flex items-center justify-between bg-gray-100 rounded-lg p-2">
          <input 
            type="text" 
            className="flex-1 bg-transparent border-none outline-none px-4"
            placeholder="The Lost World..." 
            ref={searchText} 
          />
          <button 
            type="submit" 
            className="search-button p-2 hover:bg-gray-200 rounded-full transition-colors"
            disabled={loading}
          >
            <FaSearch size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Search;
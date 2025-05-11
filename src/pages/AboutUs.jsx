import React from 'react';
import { useNavigate } from 'react-router-dom';
import bookLogo from '../assets/book.svg';
import '../App.css';
import '../index.css';
import { Button } from 'flowbite-react';
import { useAuth } from '../provider/authProvider';

function AboutUs() {
    
  const navigate = useNavigate();
  const { token } = useAuth();

    const handleHome = () => {
      navigate('/');
    };

    const goDashboard = () => {
      if (token) {
        navigate('/dashboard');
        console.log("Signed in. Navigating to dashboard.");
      } else {
        navigate('/signin');
        console.log("Not signed in. Navigating to sign in.");
      }
    };

  return (
    <>
    <div id="hero">
      <a onClick={handleHome} className="logo-button">
          <img src={bookLogo} className="logo" alt="BookMatch logo" />
      </a>
      <h2>BookMatch</h2>
    </div>
    <div id="aboutus">
      <h1>About Us</h1>
      <br></br>
      <p>BookMatch is an interactive book-recommendation app that pairs users with books based on their preferences, including genre, tropes, and age. Using a swipe-based interface, users can quickly browse curated book suggestions, save favorites, and discover new reads effortlessly.</p>
      <h4>Imagine Tinder, but for losers.</h4>
      <p>Find your next favorite read––fast.</p>
      <br></br>
      <div id="buttons">
        <Button
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:bg-gradient-to-bl focus:ring-cyan-300 dark:focus:ring-cyan-800"
          id="start"
          onClick={goDashboard}
        >
          Start swiping
        </Button>
      </div>
    </div>
    <div id="footer">
      <p>Book information by Open Library</p>
      <p>Designed and developed by Natalie Frank</p>
    </div>
      </>
  );
}

export default AboutUs;
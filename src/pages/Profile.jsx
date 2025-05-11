import React from 'react';
import { useNavigate } from 'react-router-dom';
import bookLogo from '../assets/book.svg';
import '../App.css';
import '../index.css';
import { Button } from 'flowbite-react';

function Profile() {
    
    const navigate = useNavigate();

    const handleSignOut = () => {
      navigate('/signout');
    };    

    const handleHome = () => {
      navigate('/');
    };

  return (
    <><div id="hero">
        <a onClick={handleHome} className="logo-button">
            <img src={bookLogo} className="logo" alt="BookMatch logo" />
        </a>
        <h2>BookMatch</h2>
      </div><div id="profile">
              <h1>Profile!</h1>
              <Button color="dark" onClick= { handleSignOut }> Sign out. </Button>
          </div></>
  );

}

export default Profile;
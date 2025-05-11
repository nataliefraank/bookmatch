import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import bookLogo from '../assets/book.svg';
import '../App.css';
import '../index.css';
import { Button } from "flowbite-react";
import TinderCard from 'react-tinder-card';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { useAuth } from '../provider/authProvider';

function Dashboard() {
  const navigate = useNavigate();

  // Track state in function component
  const [userPreferences, setUserPreferences] = useState({ genres: [], ageGroups: [] });
  const [books, setBooks] = useState([]);
  const [matchedBooks, setMatchedBooks] = useState([]);
  const [removedBooks, setRemovedBooks] = useState([]);
  const [readBooks, setReadBooks] = useState([]); // Feature to be added
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shortSynopsis, setShortSynopsis] = useState('Loading...');

  const currentBook = books[currentIndex] ?? null;
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  // Load user data
  const fetchUserData = async (docSnap) => {
    const data = docSnap.data();
    setBooks(data?.books || []);
    setMatchedBooks(data?.matchedBooks || []);
    setRemovedBooks(data?.removedBooks || []);
  };  

  // Load user preferences
  const loadPreferences = async () => {
    if (!user || !user.uid) return;

    console.log("Loading user preferences");

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.warn("User document does not exist.");
        return;
      }

      const data = userSnap.data();
      const preferences = data?.preferences || { genres: [], ageGroups: [] };
      setUserPreferences(preferences);
    } catch (error) {
      navigate('/preferences');
      console.error("Error loading preferences:", error);
    }
  };

  // useEffect that loads preferences
  useEffect(() => {
    loadPreferences();
  }, [user?.uid]);

  //BASICLALY NOT SAVING PREFERENCES I THINK

  // Populate data
  useEffect(() => {
    if (
      (books === undefined || books.length === 0) &&
      userPreferences.genres.length > 0 &&
      userPreferences.ageGroups.length > 0
    ) {
      findBooks();
    }
  }, [userPreferences, books]);  

  // Find and load books
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      if (!user || !user.uid) {
        console.warn("No user or user.uid found");
        return;
      }      
    
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
    
        if (!userSnap.exists()) {
          console.warn("User document does not exist.");
          return;
        }
    
        await Promise.all([
          fetchUserData(userSnap),
          loadPreferences(),
        ]);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };    
  
    loadUserData();
  }, [user?.uid]);  

  // Find books
  async function findBooks() {
    // Check if there are any selected genres or age groups
    if (userPreferences.genres.length === 0 && userPreferences.ageGroups.length === 0) {
      console.log('No genres or age groups selected');
      return;
    }
    
    // Get a random genre and age group
    const selectedGenre = userPreferences.genres[Math.floor(Math.random() * userPreferences.genres.length)];
    const selectedAge = userPreferences.ageGroups[Math.floor(Math.random() * userPreferences.ageGroups.length)];
    
    // Construct the subject string
    const subject = `${selectedGenre.toLowerCase()}`;
    
    // Create the API URL
    const url = `https://openlibrary.org/subjects/${subject}.json?limit=50`;
    
    // Fetch book data from Open Library API
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      // Check if there are any works in the response
      if (data.works && data.works.length > 0) {

        const allBooks = data.works;

        const filteredBooks = allBooks.filter(book =>
          !removedBooks.includes(book.key)
        );

        setBooks(filteredBooks);
      } else {
        console.log(`No books found for ${subject}`);
      }
    } catch (error) {
      console.log('Error fetching data: ', error);
    }
  }

  // Saves books
  const saveUserData = async (newBooks, newMatched, newRemoved) => {
    if (!user) return;

    await setDoc(doc(db, "users", user.uid), {
      books: newBooks,
      matchedBooks: newMatched,
      removedBooks: newRemoved,
    });
  };
  
  // Save changes to books
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveUserData(books, matchedBooks, removedBooks);
    }, 2000);
  
    return () => clearTimeout(timeout); // cancel if values change before 500ms
  }, [books, matchedBooks, removedBooks]);  
  
  // Fetch synposis
  useEffect(() => {
    if (!books.length || !books[currentIndex]) return;
  
    async function fetchSynopsis() {
      const book = books[currentIndex];
      if (!book?.key) {
        setShortSynopsis('No synopsis available.');
        return;
      }
  
      const workId = book.key.split('/').pop();
      const url = `https://openlibrary.org/works/${workId}.json`;
  
      try {
        const res = await fetch(url);
        const data = await res.json();
  
        const description = 
          typeof data.description === 'string'
            ? data.description
            : data.description?.value || 'No description available.';
  
        const short = description.split(' ').slice(0, 10).join(' ') + '...';
        setShortSynopsis(short);
      } catch (err) {
        console.error(err);
        setShortSynopsis('Error fetching synopsis.');
      }
    }
  
    fetchSynopsis();
  }, [books, currentIndex]); 

  // Navigation handlers
  const handle = {
    home: () => navigate('/'),
    preferences: () => navigate('/preferences'),
    signout: () => navigate('/signout'),
    matches: () => navigate('/matches'),
    back: () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    },
    dislike: () => {
      setBooks(prevBooks => {
        const updatedBooks = prevBooks.filter((_, index) => index !== currentIndex);
        const dislikedBook = prevBooks[currentIndex];
        console.log('Disliked book:', dislikedBook?.title);

        const bookKey = books[currentIndex]?.key;
        if (bookKey) {
          setRemovedBooks(prev => [...prev, bookKey]);
        }
    
        // Update currentIndex after books are updated
        setCurrentIndex(prevIndex => {
          if (prevIndex >= updatedBooks.length) {
            return Math.max(0, updatedBooks.length - 1);
          }
          return prevIndex;
        });
    
        return updatedBooks;
      });
    },
    match: () => {
      setBooks(prevBooks => {
        const matchedBook = prevBooks[currentIndex];
        console.log('Matched book:', matchedBook?.title);
    
        // Add to matchedBooks
        setMatchedBooks(prev => [...prev, matchedBook]);
    
        const updatedBooks = prevBooks.filter((_, index) => index !== currentIndex);
    
        // Update currentIndex
        setCurrentIndex(prevIndex => {
          if (prevIndex >= updatedBooks.length) {
            return Math.max(0, updatedBooks.length - 1);
          }
          return prevIndex;
        });
    
        return updatedBooks;
      });
    },
    link: () => {
      const currentBook = books[currentIndex];
      if (currentBook && currentBook.key) {
        const link = `https://openlibrary.org${currentBook.key}`;
        window.open(link, '_blank');
      }
    }
  };

  // Swipe navigation handlers
  const onSwipe = (direction) => {
    switch(direction) {
      case 'right':
        handle.match();
        break;
      case 'left':
        handle.dislike();
        break;
      default:
        console.log('You swiped: ' + direction);
        break;
    }
  }

  // If there are no books to interact with
  if (books.length === 0) {
    return <div>Loading books...</div>;
  }
    
  return (
  <>
    <header id="hero-app">

        <div id="hero-app-logo">
          <a onClick={handle.home} className="logo-button">
              <img src={bookLogo} className="logo" alt="BookMatch logo" />
          </a>
          <h2>BookMatch</h2>
        </div>

        <div id="hero-app-settings">
          <svg onClick={handle.matches} xmlns="http://www.w3.org/2000/svg" height="1.8em" viewBox="0 -960 960 960" width="1.8em" fill="#000000"><path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z"/></svg>
          <svg onClick={handle.preferences} xmlns="http://www.w3.org/2000/svg" height="1.8em" viewBox="0 -960 960 960" width="1.8em" fill="#000000"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>
          <svg onClick={handle.signout} xmlns="http://www.w3.org/2000/svg" height="1.8em" viewBox="0 -960 960 960" width="1.8em" fill="#000000"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
        </div>

    </header>

    <main id="dashboard">

      <div className="cardContainer">
      {books.map((book, index) =>
        index === currentIndex ? (
        <TinderCard
          key={book.key}
          onSwipe={onSwipe}
          preventSwipe={['up', 'down']}>
          <section id="card">
            <div className="imgWrap">
              <img src={`https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`} alt={book.title} />
              <div className="overlay">
                <h2>{book.title}</h2>
                <h3>{shortSynopsis}</h3>
                <div id="tags">
                {book.subject?.slice(0, 3).map((tag, idx) => {
                  const words = tag.split(', ');
                  const displayText = words.slice(0, 3).join(' ') + (words.length > 3 ? '…' : '');
                  return (
                    <Button key={idx} color="alternative" pill title={tag}>
                      {displayText}
                    </Button>
                  );
                })}
              </div>
              </div>
            </div>
          </section>
        </TinderCard>
        ) : null
      )}
      </div>

        <section id="action">
          <Button onClick={handle.back} size="sm" className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:bg-gradient-to-br focus:ring-blue-300 dark:focus:ring-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>
          </Button>
          <Button onClick={handle.dislike} size="xl" className="bg-gradient-to-br from-green-400 to-blue-600 text-white hover:bg-gradient-to-bl focus:ring-green-200 dark:focus:ring-green-800">
            <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#FFFFFF"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
          </Button>
          <Button onClick={handle.match} size="xl" className="bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 text-white hover:bg-gradient-to-br focus:ring-pink-300 dark:focus:ring-pink-800">
            <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#FFFFFF"><path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z"/></svg>
          </Button>
          <Button onClick={handle.link} size="sm" className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white hover:bg-gradient-to-br focus:ring-purple-300 dark:focus:ring-purple-800">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"/></svg>
          </Button>
        </section>
    </main>
  </>
  );
}

export default Dashboard;
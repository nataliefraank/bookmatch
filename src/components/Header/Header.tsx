import React from "react";
import "./Header.css";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <header className="header-wrap">
      <div className="header-bar">
        <div className="header-profile">
          <Link
            href="/pages/profile"
            className="header-emoji-link"
            title="Profile"
            aria-label="Profile"
          >
            👤
          </Link>
        </div>
        <div className="header-brand-center">
          <Link
            href="/pages/home"
            className="header-brand-link"
            title="Favorite books"
            aria-label="Bookmatch — favorite books"
          >
            <Image
              src="/home/bookmatch.png"
              alt="Bookmatch"
              width={200}
              height={44}
              className="header-brand-img"
              priority
            />
          </Link>
        </div>
        <div className="header-heart">
          <Link
            href="/pages/matches"
            className="header-emoji-link"
            title="Matched books"
            aria-label="Matched books"
          >
            📖
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;

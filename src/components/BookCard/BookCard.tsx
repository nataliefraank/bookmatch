"use client";

import React, { useState, useEffect } from 'react';
import "./BookCard.css";
import Image from "next/image";
import { matchService } from '../../app/services/matchService';

interface BookCardProps {
    Title: string;
    Author: string;
}

const BookCard = ({ Title, Author }: BookCardProps) => {
    const [isMatched, setIsMatched] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkIfMatched = async () => {
            setIsLoading(true);
            try {
                console.log('Starting match check for:', Title);
                const match = await matchService.findMatch(Title);
                
                console.log('Match result:', match);

                // Check if match exists and has a title property
                if (!match || typeof match.title !== 'string') {
                    console.log('No valid match found', match);
                    setIsMatched(false);
                    return;
                }

                const isExactMatch = match.title.toLowerCase() === Title.toLowerCase();
                console.log('Is exact match?', isExactMatch);
                
                setIsMatched(isExactMatch);
                console.log('Set isMatched to:', isExactMatch);
            } catch (error) {
                console.error("Error checking match:", error);
                setIsMatched(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkIfMatched();
    }, [Title]);

    const handleMatch = async () => {
        if (isLoading) return;

        try {
            if (!isMatched) {
                await matchService.createMatch(Title, Author);
                setIsMatched(true);
            } else {
                await matchService.removeMatch(Title);
                setIsMatched(false);
            }
        } catch (error) {
            console.error('Error updating match:', error);
        }
    };

    return (
        <div className='bookcard'>
            <div className='bookcard-title'>
                <h1>{Title}</h1>
            </div>
            <div className='bookcard-author'>
                <h2>{Author}</h2>
            </div>
            <div className='bookcard-heart'>
                {isLoading ? (
                    <div>Loading...</div>
                ) : (
                    <Image
                        className="dark:invert"
                        src={isMatched ? "/bookcard/heart-fill.svg" : "/bookcard/heart.svg"}
                        alt="Match icon"
                        width={30}
                        height={30}
                        priority
                        onClick={handleMatch}
                    />
                )}
            </div>
        </div>
    );
};

export default BookCard;

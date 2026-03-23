import React from 'react';
import "./Content.css";

interface ContentProps {
    Title: string;
    Information1: string;
    Information2: string;
}

const Content = ({ Title, Information1, Information2 }: ContentProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto text-center"> {/* Added width and centering */}
        <div className="content-title">
            {Title}
        </div>
        <ol className="font-mono list-inside list-decimal text-sm/6 max-w-2xl mx-auto"> {/* Modified centering */}
            <li className="mb-2 tracking-[-.01em]">
                {Information1}
            </li>
            <li className="tracking-[-.01em]">
                {Information2}
            </li>
        </ol>
    </div>
  )
}

export default Content;
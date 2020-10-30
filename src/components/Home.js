import React from 'react';
import { useAppState } from '../context/appContext';

export default function Home() {
    const { setPage } = useAppState();

    return (
        <div className="boho__home">
            <div className="boho__greeting">
                <p>
                    Boho is a great way to meet new friends, even while practicing social distancing. When you use Boho,
                    we pick someone else at random and let you talk one-on-one. To help you stay safe, chats are
                    anonymous unless you tell someone who you are (not suggested!), and you can stop a chat at any time.
                    Predators have been known to use Boho, so please be careful. If you prefer, you can add your
                    interests, and Boho will look for someone who's into some of the same things as you instead of
                    someone completely random.
                </p>
                <p className="boho__warning">
                    By using Boho, you accept the terms at the bottom. You must be 18+ or 13+ with parental permission.
                </p>
                <div className="boho__options">
                    <h2>Start chatting:</h2>
                    <div className="boho__buttons">
                        <button type="button" onClick={() => setPage('TEXT')}>
                            Text
                        </button>
                        <span>or</span>
                        <button type="button" onClick={() => setPage('VIDEO')}>
                            Video
                        </button>
                    </div>
                </div>
            </div>
            <div className="boho__terms">
                By using the Boho Web site, and/or related products and/or services ("Boho", provided by Boho.com LLC),
                you agree to the following terms: Do not use Boho if you are under 13. If you are under 18, use it only
                with a parent/guardian's permission. Do not transmit nudity, sexually harass anyone, publicize other
                peoples' private information, make statements that defame or libel anyone, violate intellectual property
                rights, use automated programs to start chats, or behave in any other inappropriate or illegal way on
                Boho. Understand that human behavior is fundamentally uncontrollable, that the people you encounter on
                Boho may not behave appropriately, and that they are solely responsible for their own behavior. Use Boho
                at your own peril. Disconnect if anyone makes you feel uncomfortable. You may be denied access to Boho
                for inappropriate behavior, or for any other reason. Boho IS PROVIDED AS IS, AND TO THE MAXIMUM EXTENT
                ALLOWED BY APPLICABLE LAW, IT IS PROVIDED WITHOUT ANY WARRANTY, EXPRESS OR IMPLIED, NOT EVEN A WARRANTY
                OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. TO THE MAXIMUM EXTENT ALLOWED BY APPLICABLE LAW,
                THE PROVIDER OF Boho, AND ANY OTHER PERSON OR ENTITY ASSOCIATED WITH Boho'S OPERATION, SHALL NOT BE HELD
                LIABLE FOR ANY DIRECT OR INDIRECT DAMAGES ARISING FROM THE USE OF Boho, OR ANY OTHER DAMAGES RELATED TO
                Boho OF ANY KIND WHATSOEVER. By using Boho, you accept the practices outlined in Boho's PRIVACY POLICY
                and INFORMATION ABOUT THE USE OF COOKIES (updated 2014-06-03 – contains important information about
                video chat monitoring).
            </div>
        </div>
    );
}

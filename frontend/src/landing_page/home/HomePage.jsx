import React from 'react';

import Hero from './Hero';
import Resume_checker from './Resume_checker';
import Resume_sacn from './Resume_scan';
import Work  from './Work';
import LeftSection from './LeftSection';

import FAQ from './FAQ';


function HomePage() {
    return ( 
        <>
        
        <Hero/>
        <Resume_checker/>
        {/* <Resume_sacn/> */}
        <Work/>
        <LeftSection/>
        <FAQ/> 
       
        </>
     );
}

export default HomePage;
import React from 'react';
import artwork from '../assets/zuri-go-brand-sheet.png';
import './zuri-go-logo.css';

export function ZuriGoLogo({compact=false}){
  return <span className={`zgo-logo${compact?' zgo-logo--compact':''}`} role="img" aria-label={compact?'Zuri-Go':'Zuri-Go — Let’s Go to Market. Together.'}><img src={artwork} width="1448" height="1086" alt="" aria-hidden="true"/></span>;
}

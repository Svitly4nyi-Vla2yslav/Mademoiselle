import { useId } from 'react';
import type { MenuItem } from '../lib/menuData';

export function ProductArt({item,exploded=false}:{item:MenuItem;exploded?:boolean}) {
 const id=useId().replace(/:/g,'');
 const fill=(name:string)=>'url(#'+id+name+')';
 const tall=item.id==='latte', small=item.id==='espresso'||item.id==='macchiato';
 const top=tall?47:small?109:79, bottom=224, left=tall?113:small?109:84, right=tall?207:small?211:236;
 const shape='M'+left+' '+top+' Q'+(left+5)+' 185 '+(left+22)+' '+bottom+' Q160 235 '+(right-22)+' '+bottom+' Q'+(right-5)+' 185 '+right+' '+top+'Z';
 const isMilk=item.id==='latte'||item.id==='cappuccino', foam=item.id!=='espresso'&&item.id!=='creme';
 const cake=item.category===2, tart=item.id==='berry'||item.id==='lemon', choc=item.id==='choco-cake';
 const berry=item.id==='berry'||item.id==='cheesecake'||item.id==='yogurt';
 const croissant=item.id==='croissant'||item.id==='french';
 const fruit=item.id==='breakfast'||item.id==='yogurt';
 return <svg className={'product-art'+(exploded?' exploded':'')} viewBox="0 0 320 280" role="img" aria-label={item.name+' – illustrative Vektorgrafik'}>
 <defs>
   <linearGradient id={id+'glass'}><stop stopColor="#fff" stopOpacity=".78"/><stop offset=".22" stopColor="#fff" stopOpacity=".13"/><stop offset=".72" stopColor="#fff" stopOpacity=".08"/><stop offset="1" stopColor="#c6d9d3" stopOpacity=".7"/></linearGradient>
   <linearGradient id={id+'coffee'} x2=".95" y2="1"><stop stopColor="#8e502d"/><stop offset=".45" stopColor="#512718"/><stop offset="1" stopColor="#2b1712"/></linearGradient>
   <linearGradient id={id+'pastry'} x2=".3" y2="1"><stop stopColor="#f8d68b"/><stop offset=".45" stopColor="#c88136"/><stop offset="1" stopColor="#8c471f"/></linearGradient>
   <linearGradient id={id+'cream'} x2="0" y2="1"><stop stopColor="#fff9e9"/><stop offset="1" stopColor="#dfc6a1"/></linearGradient>
   <linearGradient id={id+'choc'} x2="0" y2="1"><stop stopColor="#9b563d"/><stop offset="1" stopColor="#3c2019"/></linearGradient>
   <radialGradient id={id+'shadow'}><stop stopColor="#302825" stopOpacity=".32"/><stop offset="1" stopColor="#302825" stopOpacity="0"/></radialGradient>
   <clipPath id={id+'cup'}><path d={shape}/></clipPath>
 </defs>
 <ellipse cx="160" cy="248" rx="131" ry="17" fill={fill('shadow')}/>
 <g className="art-plate"><ellipse cx="160" cy="228" rx="132" ry="30" fill="#ede2c9" stroke="#b68b59" strokeWidth="2"/><ellipse cx="160" cy="225" rx="123" ry="23" fill="#164f52"/><ellipse cx="160" cy="223" rx="112" ry="19" fill="#fff5df"/><path d="M151 242l9-10 9 10-9-3z" fill="#b68b59"/></g>
 {item.category===0?<g>
  {!tall&&<path d={'M'+right+' '+(top+16)+' C'+(right+68)+' '+(top-5)+' '+(right+67)+' '+(bottom-27)+' '+(right-8)+' '+(bottom-28)} fill="none" stroke="#acbdb7" strokeWidth="15"/>}
  <path className="art-glass-back" d={shape} fill="#e1ede5" fillOpacity=".42" stroke="#9eaaa5" strokeWidth="2"/>
  <g clipPath={fill('cup')}>
   <g className="art-milk">{isMilk&&<rect x={left} y={tall?158:169} width={right-left} height="76" rx="5" fill={fill('cream')}/>}</g>
   <g className="art-liquid"><rect x={left} y={small?154:tall?103:top+25} width={right-left} height={tall?61:bottom-top+20} fill={item.id==='chocolate'?fill('choc'):fill('coffee')}/><ellipse cx="160" cy={small?154:tall?103:top+25} rx={(right-left)/2} ry="9" fill="#be854d"/></g>
  </g>
  <g className="art-foam">{foam&&<><ellipse cx="160" cy={small?151:tall?93:top+18} rx={small?27:(right-left)/2-7} ry={small?12:19} fill={fill('cream')}/><path d={'M142 '+(small?150:tall?91:top+15)+'q18 -17 37 0q-19 18-37 0'} fill="#fdf2d8" stroke="#c69e6e" strokeWidth="1.5"/></>}</g>
  <g className="art-glass"><path d={shape} fill={fill('glass')} stroke="#a9beb7" strokeWidth="2.5"/><ellipse cx="160" cy={top} rx={(right-left)/2} ry="13" fill="none" stroke="#d8e6e0" strokeWidth="4"/><path d={'M'+(left+12)+' '+(top+15)+' Q'+(left+18)+' 181 '+(left+30)+' 209'} stroke="#fff" strokeWidth="4" opacity=".65" fill="none"/></g>
  <g className="art-steam" fill="none" stroke="#ae8d70" strokeWidth="3" strokeLinecap="round" opacity=".65"><path d={'M145 '+(top-14)+'q-18 -16 0 -29t0 -22'}/><path d={'M175 '+(top-17)+'q16 -13 0 -28t0 -22'}/></g>
 </g>:cake?<g>
  <g className="art-base">{tart?<><path d="M75 143Q160 120 245 143L231 207Q160 228 89 207Z" fill={fill('pastry')}/>{Array.from({length:10},(_,i)=><path key={i} d={'M'+(90+i*14)+' 161l3 43'} stroke="#9d5a28" strokeWidth="2" opacity=".5"/>)}</>:<path d="M79 142L181 93L244 130V209L79 217Z" fill={fill('pastry')}/>}</g>
  <g className="art-liquid">{tart?<ellipse cx="160" cy="143" rx="85" ry="35" fill={item.id==='lemon'?'#efc751':'#a63846'} stroke="#dca354" strokeWidth="5"/>:<><path d="M79 132L181 83L244 120V196L79 206Z" fill={choc?fill('choc'):fill('cream')}/>{[0,1].map(i=><path key={i} d={'M79 '+(159+i*19)+'L244 '+(147+i*19)} stroke={choc?'#5e3024':'#e2a76e'} strokeWidth="5" opacity=".8"/>)}</>}</g>
  <g className="art-foam">{choc?<path d="M102 129l79-51 63 42-166 15z" fill="#592b21" stroke="#a96847" strokeWidth="4"/>:item.id==='lemon'?<path d="M120 144Q112 125 142 122Q137 105 165 103Q166 81 181 92Q207 116 188 130Q205 145 171 151Z" fill={fill('cream')}/>:item.id==='apple'?Array.from({length:5},(_,i)=><path key={i} d={'M'+(100+i*24)+' 132q-8 -36 24 -37q22 15 0 35z'} fill="#e9b057" stroke="#a85a25" strokeWidth="2"/>):null}</g>
  <g className="art-garnish">{berry&&Array.from({length:8},(_,i)=><g key={i}><circle cx={105+(i%4)*32+(i>3?9:0)} cy={111+Math.floor(i/4)*24-(i%2)*12} r={13+i%3*2} fill={i%3===0?'#394455':'#ad3048'} stroke="#672b37"/><ellipse cx={101+(i%4)*32+(i>3?9:0)} cy={106+Math.floor(i/4)*24-(i%2)*12} rx="4" ry="3" fill="#fff" opacity=".48"/></g>)}{item.id==='petits'&&[0,1,2].map(i=><g key={i} transform={'translate('+(80+i*60)+' 115)'}><rect width="51" height="62" rx="12" fill={['#cd8c94','#87513c','#e4bc6b'][i]}/><path d="M0 29H51" stroke="#fff1d2" strokeWidth="7"/></g>)}</g>
 </g>:<g>
  {croissant?<g className="art-base"><path d="M61 176Q65 100 149 100Q221 86 256 159Q237 189 208 173Q182 219 153 180Q110 218 96 175Q73 192 61 176Z" fill={fill('pastry')} stroke="#a75c2b" strokeWidth="3"/>{[0,1,2,3,4].map(i=><path key={i} d={'M'+(79+i*32)+' '+(146-Math.sin(i*.8)*35)+'q26 16 6 46'} stroke="#f8cf82" strokeWidth="8" fill="none" strokeLinecap="round"/>)}</g>:<g className="art-base"><path d="M69 165Q65 118 110 112L198 134Q238 154 216 199L94 215Z" fill={fill('pastry')} stroke="#a26432" strokeWidth="4"/><path d="M78 164Q75 132 111 128L199 148Q214 162 202 189L95 199Z" fill="#f2d89e"/></g>}
  <g className="art-liquid">{item.id==='french'||item.id==='croissant'?<><ellipse cx="232" cy="196" rx="32" ry="17" fill="#f8f1df" stroke="#c1a17c"/><ellipse cx="232" cy="191" rx="26" ry="11" fill="#a93849"/><rect x="51" y="185" width="31" height="20" rx="3" fill="#efd179" stroke="#c39b53"/></>:item.id==='vegetarian'?Array.from({length:5},(_,i)=><path key={i} d={'M'+(70+i*21)+' 176q-10 -59 35 -52q15 30-10 56z'} fill={i%2?'#9db859':'#6f9748'} stroke="#527c42"/>):item.id==='yogurt'?<path d="M82 124Q160 104 238 124L217 199Q160 225 103 199Z" fill={fill('cream')} stroke="#a6bfb3" strokeWidth="3"/>:<><path d="M111 148Q137 119 177 144Q207 136 212 174Q210 207 163 205Q115 216 111 148Z" fill="#fff7df"/><circle cx="163" cy="174" r="24" fill="#eeb641"/></>}</g>
  <g className="art-garnish">{fruit?Array.from({length:8},(_,i)=><circle key={i} cx={100+i%4*29} cy={131+Math.floor(i/4)*19} r="12" fill={['#b53a47','#394455','#e2a450'][i%3]}/>):item.id==='vegetarian'||item.id==='brunch'?Array.from({length:6},(_,i)=><ellipse key={i} cx={210+i%3*14} cy={120+Math.floor(i/3)*22} rx="12" ry="20" transform={'rotate('+(i*35)+' '+(210+i%3*14)+' '+(120+Math.floor(i/3)*22)+')'} fill={i%2?'#84a259':'#3e7954'}/>):null}{item.id==='french'||item.id==='breakfast'?<g transform="translate(196 52)"><path d="M0 20H66L55 70H11Z" fill="#fff1db" stroke="#b68b59" strokeWidth="2"/><ellipse cx="33" cy="20" rx="33" ry="13" fill="#ae7041"/><path d="M25 19q8-10 17 0q-8 9-17 0" fill="#f9edcf"/></g>:null}</g>
 </g>}
 </svg>;
}

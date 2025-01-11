import{u as h,r as d,a as j,j as e}from"./components-COx0tU5p.js";import{U as y,S as m,K as b,c as C,e as N}from"./kudo-DZFmgKTc.js";import{M as w}from"./modal-CU5wm0ZB.js";function E(){const r=h(),[u]=d.useState((r==null?void 0:r.error)||""),[o,x]=d.useState({message:"",style:{backgroundColor:"RED",textColor:"WHITE",emoji:"THUMBSUP"}}),n=(s,l)=>{x(t=>({...t,style:{...t.style,[l]:s.target.value}}))},c=s=>Object.keys(s).reduce((l,t)=>(l.push({name:t.charAt(0).toUpperCase()+t.slice(1).toLowerCase(),value:t}),l),[]),i=c(C),p=c(N),g=(s,l)=>{x(t=>({...t,[l]:s.target.value}))},{recipient:a,user:f}=j();return e.jsxs(w,{isOpen:!0,className:"w-2/3 p-10",children:[e.jsx("div",{className:"text-xs font-semibold text-center tracking-wide text-red-500 w-full mb-2",children:u}),e.jsxs("form",{method:"post",children:[e.jsx("input",{type:"hidden",value:a.id,name:"recipientId"}),e.jsxs("div",{className:"flex flex-col md:flex-row gap-y-2 md:gap-y-0",children:[e.jsxs("div",{className:"text-center flex flex-col items-center gap-y-2 pr-8",children:[e.jsx(y,{user:a,className:"h-24 w-24"}),e.jsxs("p",{className:"text-blue-300",children:[a.firstName," ",a.lastName]}),a.department&&e.jsx("span",{className:"px-2 py-1 bg-gray-300 rounded-xl text-blue-300 w-auto",children:a.department.charAt(0).toUpperCase()+a.department.slice(1).toLowerCase()})]}),e.jsxs("div",{className:"flex-1 flex flex-col gap-y-4",children:[e.jsx("textarea",{name:"message",className:"w-full rounded-xl h-40 p-4",value:o.message,onChange:s=>g(s,"message"),placeholder:`Say something nice about ${a.firstName}...`}),e.jsxs("div",{className:"flex flex-col items-center md:flex-row md:justify-start gap-x-4",children:[e.jsx(m,{options:i,name:"backgroundColor",value:o.style.backgroundColor,onChange:s=>n(s,"backgroundColor"),label:"Background Color",containerClassName:"w-36",className:"w-full rounded-xl px-3 py-2 text-gray-400"}),e.jsx(m,{options:i,name:"textColor",value:o.style.textColor,onChange:s=>n(s,"textColor"),label:"Text Color",containerClassName:"w-36",className:"w-full rounded-xl px-3 py-2 text-gray-400"}),e.jsx(m,{options:p,label:"Emoji",name:"emoji",value:o.style.emoji,onChange:s=>n(s,"emoji"),containerClassName:"w-36",className:"w-full rounded-xl px-3 py-2 text-gray-400"})]})]})]}),e.jsx("br",{}),e.jsx("p",{className:"text-blue-600 font-semibold mb-2",children:"Preview"}),e.jsxs("div",{className:"flex flex-col items-center md:flex-row gap-x-24 gap-y-2 md:gap-y-0",children:[e.jsx(b,{user:f,kudo:o}),e.jsx("div",{className:"flex-1"}),e.jsx("button",{type:"submit",className:"rounded-xl bg-yellow-300 font-semibold text-blue-600 w-80 h-12 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1",children:"Send"})]})]})]})}export{E as default};

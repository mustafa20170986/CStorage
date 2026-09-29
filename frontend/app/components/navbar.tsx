import Image from "next/image";
export default function Navbar() {
  return (
    <div className="flex w-full justify-center ">
       
      
      <ul className="flex justify-center gap-4 px-2">
        <li>
          <button className="btn bg-black border-indigo-300 text-indigo-400 rounded-xl">AI</button>
        </li>
        <li>
          <button className="btn bg-black border-indigo-300 text-indigo-400 rounded-xl">Pricing</button>
        </li>
        <li>
          <button className="btn bg-black border-indigo-300 text-indigo-400 rounded-xl">Get Help</button>
        </li>
        <li>
          <button className="btn bg-black border-indigo-300 text-indigo-400 rounded-xl">Blog</button>
        </li>
        <li>
          <button className="btn bg-black border-indigo-300 text-indigo-400 rounded-xl">Techstack</button>
        </li>
      </ul>
  </div>
  );
}

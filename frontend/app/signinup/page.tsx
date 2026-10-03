"use client";
import { useState } from "react";
import { useAuth } from "../context/store";
import { useRouter } from "next/navigation";

export default function SigninUp() {
  const [email, setEmail] = useState<string>("");
  const [pass, setPass] = useState<string>("");
  const { signup, login } = useAuth();
  const router = useRouter();
  const handleSignup = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!email || !pass) return;
    await signup(email, pass);
  };

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!email || !pass) return;
    await login(email, pass);
    router.push("/");
  };

  return (
    <div className="flex flex-col gap-4 p-4 w-full justify-center items-center border-2 border-indigo-400 rounded-2xl">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex border-0 bg-gray-300 text-black p-2 rounded"
        placeholder="example@gmail.com"
      />
      <input
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        className="flex border-0 bg-gray-300 text-black p-2 rounded"
        placeholder="password"
      />
      <div className="flex gap-4 justify-between">
        <button
          type="button"
          className="btn bg-indigo-500 text-white btn-ghost px-4 py-2 rounded"
          onClick={handleSignup}
        >
          Signup
        </button>
        <button
          type="button"
          className="btn bg-black border-indigo-400 text-indigo-500 px-4 py-2 rounded"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}

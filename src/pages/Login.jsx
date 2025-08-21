import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import logo from "../img/logo.png";


// 더미 로그인 함수 (항상 성공 리턴)
async function login({ email, password }) {
  console.log("로그인 시도:", email, password);
  return true; // 무조건 로그인 성공
}


export default function Login() {
    
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/app";


    const [showPw, setShowPw] = useState(false);
    const [form, setForm] = useState({ email: "", password: "", remember: false });
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);


    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    };


    const validate = () => {
        const next = { email: "", password: "" };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "올바른 이메일을 입력해 주세요.";
        if (form.password.length < 6) next.password = "비밀번호는 최소 6자 이상이어야 합니다.";
        setErrors(next);
        return !next.email && !next.password;
    };


    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            setLoading(true);
            const ok = await login({ email: form.email, password: form.password });
            if (ok) navigate(from, { replace: true }); // 로그인 이전 경로 또는 /app
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="bg-gradient-to-r from-purple-300 via-indigo-300 to-sky-300 min-h-screen">
            {/* 겹침 방지: 그리드로 좌/우 분할 (md 이상) / 모바일은 세로 스택 */}
            <div className="mx-auto max-w-7xl px-6 my-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* 로고 영역 */}
                <div className="md:order-none md:col-span-7 justify-center md:justify-start">
                    {/* md 이상에서 왼쪽/위 20% 여백 */}
                    <div className="justify-center h-full translate-y-[30%]">
                        <img src={logo} alt="Company Logo" className="h-30 w-auto drop-shadow" />
                    </div>
                </div>


                {/* 로그인 카드 영역 */}
                <div className="md:col-span-5 flex item-center justify-center h-full">
                    <div className="w-full max-w-md md:ml-auto translate-y-[30%]">
                        <div className="mb-4 flex justify-end">
                            <div className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-white text-sm font-medium shadow">
                                SMART ERP · MES
                            </div>
                        </div>


                        <div className="rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur p-8">
                            <div className="mb-8">
                                <h1 className="text-2xl font-semibold text-gray-900">로그인</h1>
                                <p className="mt-1 text-sm text-gray-500">스마트팩토리 ERP/MES</p>
                            </div>


                            <form onSubmit={onSubmit} className="space-y-5" noValidate>
                                {/* 이메일 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={onChange}
                                        className={`w-full rounded-xl border bg-white px-3 py-2.5 outline-none transition placeholder:text-gray-400
                      focus:ring-2 focus:ring-indigo-400/60
                      ${errors.email ? "border-rose-400 focus:ring-rose-300" : "border-gray-300 focus:border-indigo-500"}`}
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email}</p>}
                                </div>


                                {/* 비밀번호 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                                    <div className="relative">
                                        <input
                                            name="password"
                                            type={showPw ? "text" : "password"}
                                            placeholder="••••••"
                                            value={form.password}
                                            onChange={onChange}
                                            className={`w-full rounded-xl border bg-white px-3 py-2.5 pr-10 outline-none transition placeholder:text-gray-400
                        focus:ring-2 focus:ring-indigo-400/60
                        ${errors.password ? "border-rose-400 focus:ring-rose-300" : "border-gray-300 focus:border-indigo-500"}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw((v) => !v)}
                                            className="absolute inset-y-0 right-0 px-3 grid place-items-center text-gray-500 hover:text-gray-700"
                                        >
                                            {showPw ? "숨김" : "보기"}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password}</p>}
                                </div>


                                {/* 옵션/링크 */}
                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            checked={form.remember}
                                            onChange={onChange}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700">로그인 상태 유지</span>
                                    </label>
                                    <a href="#" className="text-indigo-600 hover:underline">비밀번호 찾기</a>
                                </div>


                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-indigo-500 text-white font-medium py-2.5 hover:bg-indigo-700 active:bg-indigo-800 transition shadow disabled:opacity-60"
                                >
                                    {loading ? "로그인 중..." : "로그인"}
                                </button>
                            </form>


                            <p className="text-center text-sm text-gray-500 mt-6">
                                계정이 없으신가요?{" "}
                                <a href="#" className="text-indigo-600 hover:underline">회원가입</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

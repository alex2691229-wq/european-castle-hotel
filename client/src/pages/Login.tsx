// @ts-nocheck
// DEPLOY_SYNC_ID: Production-v2.1
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // 使用 TRPC 登入 mutation
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      // 登入成功 - 清除錯誤
      setError("");
      setIsLoading(false);
      
      // 儲存用戶信息到 localStorage（備用）
      if (data.user) {
        localStorage.setItem("auth_user", JSON.stringify(data.user));
      }
      
      // 刷新 auth.me 查詢，確保 Navbar 更新
      console.log("✅ 登入成功，刷新認證狀態");
      await utils.auth.me.invalidate();
      
      // 自動跳轉到後台
      setTimeout(() => {
        console.log("✅ 跳轉到 /admin");
        setLocation("/admin");
      }, 500);
    },
    onError: (error) => {
      // 登入失敗
      const errorMessage = error.message || "登入失敗，請檢查帳號密碼";
      setError(errorMessage);
      setIsLoading(false);
      console.error("❌ 登入錯誤:", errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !password) {
      setError("請輸入帳號和密碼");
      setIsLoading(false);
      return;
    }

    // 添加超時機制，防止 UI 死鎖
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setError("登入請求超時，請檢查網路連接");
        setIsLoading(false);
        // 重置 mutation 狀態
        loginMutation.reset();
      }
    }, 10000); // 10 秒超時

    try {
      // 調用 TRPC 登入
      loginMutation.mutate(
        { username, password },
        {
          onSettled: () => {
            clearTimeout(timeoutId);
          },
        }
      );
    } catch (err) {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  // 按鈕是否禁用：要麼是 mutation 正在進行，要麼是本地加載狀態
  const isButtonDisabled = loginMutation.isPending || isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-yellow-500">
            歐堡商務汽車旅館
          </h2>
          <p className="mt-2 text-sm text-gray-400">管理後台登入</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                帳號
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="請輸入帳號"
                disabled={isButtonDisabled}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="請輸入密碼"
                disabled={isButtonDisabled}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isButtonDisabled}
            className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isButtonDisabled ? "登入中..." : "登入"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">或</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isButtonDisabled}
          className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          使用 Google 登入
        </button>

        <p className="text-center text-sm text-gray-400">
          使用帳號密碼或 Google 帳號登入管理後台
        </p>
      </div>
    </div>
  );
}

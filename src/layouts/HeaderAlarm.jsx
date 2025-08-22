import { UserCircleIcon, BellIcon, QuestionMarkCircleIcon, SpeakerWaveIcon, PrinterIcon, CubeIcon} from "@heroicons/react/24/solid";
import { useAuth } from "../auth/AuthContext";

export default function HeaderAlarm() {
  const { user } = useAuth();

  return (
    <div className="w-full py-3 bg-gradient-to-l from-indigo-200 to-sky-200 flex items-center justify-end px-4 shadow-sm">
      
      <div className="flex items-center space-x-6 text-sky-400">
        <CubeIcon className="w-5 h-5 cursor-pointer hover:text-sky-600" />
        <PrinterIcon className="w-5 h-5 cursor-pointer hover:text-sky-600" />
        <SpeakerWaveIcon className="w-5 h-5 cursor-pointer hover:text-sky-600" />
        <QuestionMarkCircleIcon className="w-5 h-5 cursor-pointer hover:text-sky-600" />
        <BellIcon className="w-5 h-5 cursor-pointer hover:text-sky-600" />
      </div>

      {/* 버튼 */}
      <button className="ml-6 border rounded-full px-4 py-1 text-sm text-sky-600 border-sky-300 hover:bg-sky-50 transition">
        임직원포털 바로가기
      </button>
      
      <div className="ml-4 flex items-center space-x-2">
        <UserCircleIcon className="h-5 w-5 text-sky-500" />
        <span className="font-bold text-sky-500">
          {user ? `${user.email.split("@")[0]} 님 로그인` : null}
        </span>
      </div>
      
    </div>
  );
}

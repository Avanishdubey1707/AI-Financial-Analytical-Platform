import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AppLayout = () => {
    return (
        <div className="min-h-screen bg-[#f7f8fa] text-gray-900">
            <Sidebar />

            <div className="lg:pl-[260px]">
                <Topbar />

                <main className="p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
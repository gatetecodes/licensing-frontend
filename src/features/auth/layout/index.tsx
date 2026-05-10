import React from "react";
import AuthIllustration from "./auth-illustration";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 w-full min-h-screen">
      <div className="flex items-center justify-center">
        <AuthIllustration />
      </div>
      <div className="flex items-center justify-center bg-white">
        <div className="flex flex-col p-5 w-full lg:max-w-[650px]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

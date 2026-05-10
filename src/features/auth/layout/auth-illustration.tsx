import authIllustration from "../../../assets/images/login-image.svg";
import { Image } from "antd";
import { Logo } from "@/components/logo";

const AuthIllustration = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <Logo size={40} />
      <h1 className="text-2xl font-bold">BNR Licensing Portal</h1>
      <Image
        src={authIllustration}
        alt="Auth Illustration"
        width={500}
        height={500}
        preview={false}
      />
    </div>
  );
};

export default AuthIllustration;

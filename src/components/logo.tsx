import { Image } from "antd";

import bnrLogo from "@/assets/images/bnr-logo.webp";

interface LogoProps {
  size?: number;
}

export const Logo = ({ size = 20 }: LogoProps) => {
  const dim = `${size * 0.25}rem`;
  return (
    <Image
      src={bnrLogo}
      alt="BNR Licensing"
      preview={false}
      style={{ width: dim, height: dim, objectFit: "contain" }}
    />
  );
};

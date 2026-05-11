import { Link } from "@tanstack/react-router";

type DashboardFooterProps = {
  portalDescriptor: string;
  activePath: string;
};

const DashboardFooter = ({
  portalDescriptor,
  activePath,
}: DashboardFooterProps) => {
  return (
    <div className="w-full flex items-center justify-between p-4">
      <div className="flex items-center">
        <p className="text-sm text-gray-500 mb-0!">{portalDescriptor}</p>
        <div className="flex items-center gap-2">
          {activePath !== "/dashboard" ? (
            <p className="text-sm text-gray-500! mb-0! ml-2!">|</p>
          ) : null}
          {activePath !== "/dashboard" ? (
            <Link className="text-primary!" to="/dashboard">
              Back to overview
            </Link>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        &copy; {new Date().getFullYear()} National Bank of Rwanda. All rights
        reserved.
      </p>
    </div>
  );
};

export default DashboardFooter;

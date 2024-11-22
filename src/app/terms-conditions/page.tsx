import React from "react";
import {
  Shield,
  Camera,
  Wifi,
  Trash2,
  Cigarette,
  HardHat,
  IdCard,
  AlertCircle,
} from "lucide-react";

const Page = () => {
  return (
    <main className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 pt-[calc(56px)]">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-gray-900 dark:text-gray-100 mb-0.5" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Visitor Information
          </h1>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            <div className="space-y-3">
              <p className="text-gray-900 dark:text-white font-medium">
                Please ensure you comply with the following requirements:
              </p>
              <ol className="text-gray-800 dark:text-gray-200 space-y-2 list-decimal ml-4">
                <li className="pl-2">
                  <p>
                    Visitor must be guided/supervised by ALVA Plant's Employee
                    during their stay in the ALVA Plant area.
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    Visitor's information and data provided to ALVA Plant must
                    be valid and true.
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    Visitor's information and data are under ALVA Plant's
                    responsibility and will be fully protected from privacy
                    infringement.
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    Visitors are required to wear safety equipment (APD) before
                    entering the production area.
                  </p>
                </li>
                <li className="pl-2">
                  <p>
                    Visitor shall agree upon ALVA Plant's Regulation & Willing
                    to comply with all the requestment, as follow:
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <IdCard className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              1. Trade ID Required
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Exchange ID for Visitor Card/Vehicle Access
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <Camera className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              2. No Photography
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              All cameras and ports must be sealed
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <Wifi className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              3. No Network Access
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Do not connect to Data/LAN ports
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <Trash2 className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              4. No Littering
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Keep the premises clean
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <Cigarette className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              5. No Smoking
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Smoking is strictly prohibited
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-xl p-6 flex flex-col items-center text-center group border border-gray-200 dark:border-gray-600">
            <HardHat className="w-8 h-8 text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              6. Safety Protocol
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Follow all safety & health guidelines
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;

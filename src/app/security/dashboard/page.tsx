import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import QRScanner from "@/components/qrscanner";
import VisitForm from "@/components/visitform";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.role !== "security") {
    redirect("/error/restricted");
  }

  return (
    <div>
      <div className="flex justify-center items-center mt-9">
        <VisitForm />
      </div>
    </div>
  );
};

export default page;

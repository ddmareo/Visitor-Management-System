import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import VisitList from "@/components/visitlist";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.role !== "security") {
    redirect("/error/restricted");
  }

  return (
    <div>
      <div className="mt-5">
        <VisitList />
      </div>
    </div>
  );
};

export default page;

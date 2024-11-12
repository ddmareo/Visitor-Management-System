import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Table from "@/components/table";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.role !== "admin") {
    redirect("/error/restricted");
  }

  return (
    <div>
      <div className="font-bold text-3xl flex justify-center items-center my-10">
        <h1>Welcome back, Admin!</h1>
      </div>
      <div className="flex justify-center items-center mx-20">
        <Table />
      </div>
    </div>
  );
};

export default page;

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.role !== "user") {
    redirect("/error/restricted");
  }

  return (
    <div className="mt-5 font-bold text-3xl ml-5">
      <h1>Welcome back, User!</h1>
    </div>
  );
};

export default page;
